import { and, desc, eq } from 'drizzle-orm';

import { db } from './db/client';
import { predModelRun, predPlayerGw } from './db/schema';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
import * as fplClient from './fpl-client';
import { PREVIEW_TEAM_LIMIT } from './prediction/preview-limits';
import type { MarketPreviewResponse, MarketResponse, TeamMarketDto } from './prediction/types';

async function loadMarketTeams(event: number): Promise<{
  event: number;
  modelRunId: string | null;
  ready: boolean;
  teams: TeamMarketDto[];
}> {
  const [run] = await db
    .select()
    .from(predModelRun)
    .where(and(eq(predModelRun.kind, 'score'), eq(predModelRun.targetEvent, event)))
    .orderBy(desc(predModelRun.createdAt))
    .limit(1);

  if (!run) {
    return { event, modelRunId: null, ready: false, teams: [] };
  }

  const rows = await db
    .select()
    .from(predPlayerGw)
    .where(and(eq(predPlayerGw.modelRunId, run.id), eq(predPlayerGw.event, event)));

  if (rows.length === 0) {
    return { event, modelRunId: run.id, ready: false, teams: [] };
  }

  const [bootstrap, fixtures] = await Promise.all([
    getOrFetchBootstrap(db),
    fplClient.getFixtures(event).catch(() => [] as fplClient.FPLFixture[]),
  ]);

  const teamById = new Map(bootstrap.teams.map((t) => [t.id, t]));
  const codeToElement = new Map(bootstrap.elements.map((el) => [el.code, el]));

  const teamXGoals = new Map<number, number>();
  const teamCsProbs = new Map<number, number[]>();

  for (const row of rows) {
    const el = codeToElement.get(row.fplCode);
    if (!el) continue;
    const teamId = el.team;

    teamXGoals.set(teamId, (teamXGoals.get(teamId) ?? 0) + row.xGoals);

    const position = el.element_type;
    if ((position === 1 || position === 2) && row.csProb !== null) {
      const bucket = teamCsProbs.get(teamId) ?? [];
      bucket.push(row.csProb);
      teamCsProbs.set(teamId, bucket);
    }
  }

  const teamFixtures = new Map<number, Array<{ opponentTeamId: number; isHome: boolean }>>();
  for (const fix of fixtures) {
    const home = teamFixtures.get(fix.team_h) ?? [];
    home.push({ opponentTeamId: fix.team_a, isHome: true });
    teamFixtures.set(fix.team_h, home);

    const away = teamFixtures.get(fix.team_a) ?? [];
    away.push({ opponentTeamId: fix.team_h, isHome: false });
    teamFixtures.set(fix.team_a, away);
  }

  const teams: TeamMarketDto[] = [];

  for (const [teamId, xG] of teamXGoals) {
    const team = teamById.get(teamId);
    if (!team) continue;

    const csProbs = teamCsProbs.get(teamId) ?? [];
    const csProb = csProbs.length > 0 ? Math.max(...csProbs) : 0;

    const fixList = teamFixtures.get(teamId) ?? [];
    const fixturesSummary = fixList.map((f) => ({
      opponentTeamId: f.opponentTeamId,
      opponentShortName: teamById.get(f.opponentTeamId)?.short_name ?? String(f.opponentTeamId),
      isHome: f.isHome,
    }));

    teams.push({
      teamId,
      teamCode: team.code,
      teamName: team.name,
      teamShortName: team.short_name,
      fixtures: fixturesSummary,
      csProb,
      xG,
      xGA: 0,
    });
  }

  return { event, modelRunId: run.id, ready: teams.length > 0, teams };
}

export async function getMarketForEvent(event: number): Promise<MarketResponse> {
  const loaded = await loadMarketTeams(event);
  return {
    event: loaded.event,
    modelRunId: loaded.modelRunId,
    ready: loaded.ready,
    teams: loaded.teams,
  };
}

export async function getMarketPreviewForEvent(event: number): Promise<MarketPreviewResponse> {
  const loaded = await loadMarketTeams(event);
  if (!loaded.ready) {
    return {
      event: loaded.event,
      modelRunId: loaded.modelRunId,
      ready: false,
      topCs: [],
      topXg: [],
    };
  }

  const topCs = [...loaded.teams]
    .sort((a, b) => b.csProb - a.csProb)
    .slice(0, PREVIEW_TEAM_LIMIT);
  const topXg = [...loaded.teams]
    .sort((a, b) => b.xG - a.xG)
    .slice(0, PREVIEW_TEAM_LIMIT);

  return {
    event: loaded.event,
    modelRunId: loaded.modelRunId,
    ready: true,
    topCs,
    topXg,
  };
}
