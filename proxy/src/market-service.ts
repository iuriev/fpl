import { and, desc, eq, isNotNull } from 'drizzle-orm';

import { db } from './db/client';
import { predFixtureTeam, predModelRun } from './db/schema';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
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
    .from(predFixtureTeam)
    .where(
      and(
        eq(predFixtureTeam.modelRunId, run.id),
        eq(predFixtureTeam.event, event),
        isNotNull(predFixtureTeam.opponentTeamId),
      ),
    );

  if (rows.length === 0) {
    return { event, modelRunId: run.id, ready: false, teams: [] };
  }

  const bootstrap = await getOrFetchBootstrap(db);
  const teamById = new Map(bootstrap.teams.map((t) => [t.id, t]));

  const byTeamId = new Map<number, typeof rows>();
  for (const row of rows) {
    const existing = byTeamId.get(row.teamId) ?? [];
    existing.push(row);
    byTeamId.set(row.teamId, existing);
  }

  const teams: TeamMarketDto[] = [];

  for (const [teamId, fixtures] of byTeamId) {
    const team = teamById.get(teamId);
    if (!team) continue;

    const csProb =
      fixtures.length === 1
        ? fixtures[0].csProb
        : 1 - fixtures.reduce((acc, f) => acc * (1 - f.csProb), 1);

    const xG = fixtures.reduce((acc, f) => acc + f.lambdaFor, 0);
    const xGA = fixtures.reduce((acc, f) => acc + f.lambdaAgainst, 0);

    const fixturesSummary = fixtures.map((f) => {
      const opp = teamById.get(f.opponentTeamId!);
      return {
        opponentTeamId: f.opponentTeamId!,
        opponentShortName: opp?.short_name ?? String(f.opponentTeamId),
        isHome: f.isHome,
      };
    });

    teams.push({
      teamId,
      teamName: team.name,
      teamShortName: team.short_name,
      fixtures: fixturesSummary,
      csProb,
      xG,
      xGA,
    });
  }

  return { event, modelRunId: run.id, ready: teams.length > 0, teams };
}
