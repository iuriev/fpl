import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import * as schema from '../db/schema';
import { loadEplMatchesFromDisk, loadMergedGwFromDisk } from './ingest';
import { scoreGameweekFacts } from './player-layer';
import { fitTeamPoisson } from './team-poisson';
import type { EplMatchRow, PlayerGwFactRow } from './types';

const TRAIN_SEASONS = ['2022-23', '2023-24'];

export async function loadMatchesFromDb(
  db: PostgresJsDatabase<typeof schema>,
): Promise<EplMatchRow[]> {
  const rows = await db.select().from(schema.predEplMatch);
  return rows.map((r) => ({
    season: r.season,
    matchDate: r.matchDate,
    homeSlug: r.homeSlug,
    awaySlug: r.awaySlug,
    fthg: r.fthg,
    ftag: r.ftag,
    ftr: r.ftr,
    referee: r.referee ?? undefined,
    homeShots: r.homeShots ?? undefined,
    awayShots: r.awayShots ?? undefined,
    oddsHome: r.oddsHome ?? undefined,
    oddsDraw: r.oddsDraw ?? undefined,
    oddsAway: r.oddsAway ?? undefined,
    oddsOver25: r.oddsOver25 ?? undefined,
    oddsUnder25: r.oddsUnder25 ?? undefined,
  }));
}

export async function loadFactsForScoring(
  _db: PostgresJsDatabase<typeof schema>,
  season: string,
  dataDir?: string,
): Promise<PlayerGwFactRow[]> {
  return loadMergedGwFromDisk(season, dataDir);
}

export async function runScoreGameweek(
  db: PostgresJsDatabase<typeof schema>,
  season: string,
  targetEvent: number,
  dataDir?: string,
): Promise<string> {
  let matches = await loadMatchesFromDb(db);
  if (matches.length < 100) {
    matches = await loadEplMatchesFromDisk(dataDir);
  }
  const trainMatches = matches.filter((m) => TRAIN_SEASONS.includes(m.season));
  const fit = fitTeamPoisson(trainMatches.length > 0 ? trainMatches : matches);

  const facts = await loadFactsForScoring(db, season, dataDir);
  const aliasRows = await db.select().from(schema.predTeamAlias);
  const idToSlug = new Map(aliasRows.map((a) => [a.fplTeamId, a.slug]));

  const trainMaxGw = targetEvent - 1;
  const predictions = scoreGameweekFacts(
    facts,
    fit,
    idToSlug,
    targetEvent,
    trainMaxGw,
  );

  const [run] = await db
    .insert(schema.predModelRun)
    .values({
      kind: 'score',
      season,
      targetEvent,
      params: { trainMaxGw, trainSeasons: TRAIN_SEASONS },
      metrics: { players: predictions.length },
    })
    .returning({ id: schema.predModelRun.id });

  const runId = run.id;

  const strengthRows = fit.teams.map((t) => ({
    modelRunId: runId,
    season,
    teamSlug: t,
    attack: fit.attack.get(t) ?? 0,
    defence: fit.defence.get(t) ?? 0,
    homeAdv: fit.homeAdv,
    mu: fit.mu,
  }));
  if (strengthRows.length > 0) {
    await db.insert(schema.predTeamStrength).values(strengthRows);
  }

  if (predictions.length > 0) {
    await db.insert(schema.predPlayerGw).values(
      predictions.map((p) => ({
        modelRunId: runId,
        event: p.event,
        playerId: p.playerId,
        xPts: p.xPts,
        xGoals: p.xGoals,
        xAssists: p.xAssists,
        csProb: p.csProb,
        defconPts: p.defconPts,
        confidence: p.confidence,
        epNextAnchor: p.epNextAnchor,
        modelXPts: p.modelXPts,
      })),
    );
  }

  return runId;
}
