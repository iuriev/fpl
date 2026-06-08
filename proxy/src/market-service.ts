import { and, desc, eq } from 'drizzle-orm';

import { db } from './db/client';
import { predModelRun, predPlayerGw } from './db/schema';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
import * as fplClient from './fpl-client';
import type { MarketResponse, TeamMarketDto } from './prediction/types';

export async function getMarketForEvent(event: number): Promise<MarketResponse> {
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

  // Build per-team aggregates from player predictions
  const teamXGoals = new Map<number, number>();
  const teamCsProbs = new Map<number, number[]>();

  for (const row of rows) {
    const el = codeToElement.get(row.fplCode);
    if (!el) continue;
    const teamId = el.team;

    teamXGoals.set(teamId, (teamXGoals.get(teamId) ?? 0) + row.xGoals);

    // csProb is only set for GK/DEF and equals csTeam * minsProb
    // Use the GK's csProb as the best proxy for team CS probability
    const position = el.element_type; // 1=GK, 2=DEF, 3=MID, 4=FWD
    if ((position === 1 || position === 2) && row.csProb !== null) {
      const bucket = teamCsProbs.get(teamId) ?? [];
      bucket.push(row.csProb);
      teamCsProbs.set(teamId, bucket);
    }
  }

  // Build fixture map: teamId -> [{opponentId, isHome}]
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
    // Take max csProb among GK/DEF — best represents the team's actual clean sheet chance
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
