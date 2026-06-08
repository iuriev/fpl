import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import * as schema from '../db/schema';
import { getOrFetchBootstrap } from '../fpl-cache/db-cache';
import { deriveSeason } from '../fpl-cache/season';
import {
  elementToFplCodeFromBootstrap,
  isSeasonComplete,
  loadCurrentSeasonFacts,
} from './current-season';
import { loadEplMatchesFromDisk, loadMergedGwFromDisk } from './ingest';
import { attachFplCodes, loadElementToFplCode } from './player-code-map';
import { scoreGameweekFacts } from './player-layer';
import { fitTeamPoisson } from './team-poisson';
import type { EplMatchRow, PlayerGwFactRow } from './types';

async function loadTacticalRolesMap(
  elementToCode: Map<number, number>,
): Promise<Map<number, string>> {
  const path = join(new URL('.', import.meta.url).pathname, '..', 'data', 'player-tactical-roles.json');
  let raw: Record<string, { role: string }>;
  try {
    const text = await readFile(path, 'utf8');
    raw = JSON.parse(text) as Record<string, { role: string }>;
  } catch {
    return new Map();
  }
  const codeToRole = new Map<number, string>();
  for (const [codeStr, { role }] of Object.entries(raw)) {
    codeToRole.set(Number(codeStr), role);
  }
  const result = new Map<number, string>();
  for (const [element, code] of elementToCode) {
    const role = codeToRole.get(code);
    if (role) result.set(element, role);
  }
  return result;
}

const TRAIN_SEASONS = ['2022-23', '2023-24'];

const PRIOR_SEASON_FALLBACK_GW_THRESHOLD = 5;

async function loadPriorSeasonCarryIn(
  currentFacts: PlayerGwFactRow[],
  targetEvent: number,
  currentElementToCode: Map<number, number>,
  dataDir?: string,
): Promise<PlayerGwFactRow[]> {
  const useAllPrior = targetEvent <= PRIOR_SEASON_FALLBACK_GW_THRESHOLD;

  const gwCountByElement = new Map<number, number>();
  for (const f of currentFacts) {
    gwCountByElement.set(f.element, (gwCountByElement.get(f.element) ?? 0) + 1);
  }

  const needsPrior = new Set<number>();
  if (useAllPrior) {
    for (const f of currentFacts) needsPrior.add(f.element);
  } else {
    for (const [element, count] of gwCountByElement) {
      if (count < PRIOR_SEASON_FALLBACK_GW_THRESHOLD) needsPrior.add(element);
    }
  }

  if (needsPrior.size === 0) return [];

  const codeToCurrentElement = new Map<number, number>();
  for (const [element, code] of currentElementToCode) {
    codeToCurrentElement.set(code, element);
  }

  const priorFacts: PlayerGwFactRow[] = [];
  for (const priorSeason of TRAIN_SEASONS) {
    let priorFacts_: PlayerGwFactRow[];
    try {
      priorFacts_ = await loadMergedGwFromDisk(priorSeason, dataDir);
    } catch {
      continue;
    }
    let priorElementToCode: Map<number, number>;
    try {
      priorElementToCode = await loadElementToFplCode(priorSeason, dataDir);
    } catch {
      continue;
    }
    for (const f of priorFacts_) {
      const code = priorElementToCode.get(f.element);
      if (!code) continue;
      const currentElement = codeToCurrentElement.get(code);
      if (!currentElement) continue;
      if (!needsPrior.has(currentElement)) continue;
      priorFacts.push({ ...f, element: currentElement });
    }
  }

  return priorFacts;
}

export async function loadFactsWithPriorSeasons(
  season: string,
  targetEvent: number,
  dataDir?: string,
): Promise<PlayerGwFactRow[]> {
  const currentFacts = await loadMergedGwFromDisk(season, dataDir);
  const currentElementToCode = await loadElementToFplCode(season, dataDir);
  const priorFacts = await loadPriorSeasonCarryIn(currentFacts, targetEvent, currentElementToCode, dataDir);
  return [...priorFacts, ...currentFacts];
}

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
  db: PostgresJsDatabase<typeof schema>,
  season: string,
  targetEvent: number,
  dataDir?: string,
): Promise<PlayerGwFactRow[]> {
  const bootstrap = await getOrFetchBootstrap(db);
  const isCurrentSeason = deriveSeason(bootstrap.events) === season;

  // Current season always uses element-summary cache (FPL API or already-cached DB data).
  // Switching to disk CSV only happens after the season-export script archives data to repo.
  if (isCurrentSeason) {
    const complete = isSeasonComplete(bootstrap);
    console.log(`[pred:score] season=${season} current complete=${complete} — loading from element-summary cache`);
    const currentFacts = await loadCurrentSeasonFacts(db, season, targetEvent, bootstrap);
    const elementToCode = elementToFplCodeFromBootstrap(bootstrap);
    const priorFacts = await loadPriorSeasonCarryIn(currentFacts, targetEvent, elementToCode, dataDir);
    return [...priorFacts, ...currentFacts];
  }

  console.log(`[pred:score] season=${season} archived — loading from disk CSV`);
  return loadFactsWithPriorSeasons(season, targetEvent, dataDir);
}

export async function runScoreGameweek(
  db: PostgresJsDatabase<typeof schema>,
  season: string,
  targetEvent: number,
  dataDir?: string,
): Promise<string> {
  const tag = `[pred:score] event=${targetEvent} season=${season}`;
  console.log(`${tag} starting`);

  let matches = await loadMatchesFromDb(db);
  const fromDisk = matches.length < 100;
  if (fromDisk) {
    matches = await loadEplMatchesFromDisk(dataDir);
  }
  const trainMatches = matches.filter((m) => TRAIN_SEASONS.includes(m.season));
  console.log(
    `${tag} matches source=${fromDisk ? 'disk' : 'db'} total=${matches.length}` +
    ` train=${trainMatches.length} (seasons: ${TRAIN_SEASONS.join(', ')})`,
  );

  const fit = fitTeamPoisson(trainMatches.length > 0 ? trainMatches : matches);
  console.log(`${tag} poisson fit teams=${fit.teams.length} mu=${fit.mu.toFixed(4)}`);

  const facts = await loadFactsForScoring(db, season, targetEvent, dataDir);
  const targetFacts = facts.filter((f) => f.round === targetEvent);
  const priorFacts = facts.filter((f) => f.season !== season);
  console.log(
    `${tag} facts total=${facts.length} for_event=${targetFacts.length}` +
    ` prior_season_carry_in=${priorFacts.length}`,
  );

  const aliasRows = await db.select().from(schema.predTeamAlias);
  const idToSlug = new Map(aliasRows.map((a) => [a.fplTeamId, a.slug]));
  console.log(`${tag} team aliases=${aliasRows.length}`);

  const trainMaxGw = targetEvent - 1;

  const bootstrap = await getOrFetchBootstrap(db);
  const isCurrentSeason = deriveSeason(bootstrap.events) === season;
  const elementToCode = isCurrentSeason
    ? elementToFplCodeFromBootstrap(bootstrap)
    : await loadElementToFplCode(season, dataDir);
  console.log(`${tag} player code map size=${elementToCode.size} source=${isCurrentSeason ? 'bootstrap' : 'disk'}`);

  const tacticalRoles = await loadTacticalRolesMap(elementToCode);
  console.log(`${tag} tactical roles mapped=${tacticalRoles.size}`);

  const rawPredictions = scoreGameweekFacts(
    facts,
    fit,
    idToSlug,
    targetEvent,
    trainMaxGw,
    tacticalRoles,
  );
  console.log(`${tag} raw predictions=${rawPredictions.length}`);

  const predictions = attachFplCodes(rawPredictions, elementToCode);
  const skippedNoCode = rawPredictions.length - predictions.length;
  console.log(
    `${tag} predictions with_fpl_code=${predictions.length} skipped_no_code=${skippedNoCode}`,
  );

  const [run] = await db
    .insert(schema.predModelRun)
    .values({
      kind: 'score',
      season,
      targetEvent,
      params: { trainMaxGw, trainSeasons: TRAIN_SEASONS },
      metrics: {
        players: predictions.length,
        skippedNoCode,
      },
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
    console.log(`${tag} inserted team_strength rows=${strengthRows.length}`);
  }

  if (predictions.length > 0) {
    await db.insert(schema.predPlayerGw).values(
      predictions.map((p) => ({
        modelRunId: runId,
        event: p.event,
        fplCode: p.fplCode,
        seasonElementId: p.seasonElementId,
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
    console.log(`${tag} inserted player_gw rows=${predictions.length}`);
  }

  return runId;
}
