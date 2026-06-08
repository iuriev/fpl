import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import * as schema from '../db/schema';
import { getOrFetchBootstrap } from '../fpl-cache/db-cache';
import type { FPLElementSummary } from '../fpl-client';
import type { PlayerGwFactRow } from './types';

const POSITION_MAP: Record<number, string> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

export async function loadCurrentSeasonFactsFromCache(
  db: PostgresJsDatabase<typeof schema>,
  season: string,
): Promise<PlayerGwFactRow[]> {
  const bootstrap = await getOrFetchBootstrap(db);
  const elementMeta = new Map(
    bootstrap.elements.map((e) => [
      e.id,
      { teamId: e.team, position: POSITION_MAP[e.element_type] ?? 'MID' },
    ]),
  );

  const rows = await db
    .select()
    .from(schema.fplElementSummaryCache)
    .where(eq(schema.fplElementSummaryCache.season, season));

  const facts: PlayerGwFactRow[] = [];
  for (const row of rows) {
    const data = row.data as FPLElementSummary;
    const meta = elementMeta.get(row.elementId);
    if (!meta || !data.history?.length) continue;
    for (const h of data.history) {
      if (!h.round) continue;
      facts.push({
        season,
        round: h.round,
        element: row.elementId,
        fixture: h.fixture,
        teamId: meta.teamId,
        position: meta.position,
        minutes: h.minutes,
        starts: h.starts,
        goals: h.goals_scored,
        assists: h.assists,
        totalPoints: h.total_points,
        xp: 0,
        expectedGoals: Number(h.expected_goals) || 0,
        expectedAssists: Number(h.expected_assists) || 0,
        defensiveContribution: h.defensive_contribution,
        opponentTeam: h.opponent_team,
        wasHome: h.was_home,
      });
    }
  }
  return facts;
}
