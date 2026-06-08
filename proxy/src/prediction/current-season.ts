import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import * as schema from '../db/schema';
import type { FPLBootstrapStatic, FPLFixture } from '../fpl-client';
import { getOrFetchAllFixtures } from '../fpl-fixtures-cache';
import { loadCurrentSeasonFactsFromCache } from './fpl-cache-facts';
import type { PlayerGwFactRow } from './types';

type Db = PostgresJsDatabase<typeof schema>;

const POSITION_MAP: Record<number, string> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

export function isSeasonComplete(bootstrap: FPLBootstrapStatic): boolean {
  const gw38 = bootstrap.events.find((e) => e.id === 38);
  return gw38?.finished === true && gw38?.data_checked === true;
}

export function elementToFplCodeFromBootstrap(
  bootstrap: FPLBootstrapStatic,
): Map<number, number> {
  return new Map(bootstrap.elements.map((e) => [e.id, e.code]));
}

export function buildTargetEventRows(
  bootstrap: FPLBootstrapStatic,
  fixtures: FPLFixture[],
  season: string,
  targetEvent: number,
): PlayerGwFactRow[] {
  const eventFixtures = fixtures.filter((f) => f.event === targetEvent);

  const teamFixture = new Map<number, { opponentTeam: number; wasHome: boolean; fixture: number }>();
  for (const f of eventFixtures) {
    teamFixture.set(f.team_h, { opponentTeam: f.team_a, wasHome: true, fixture: f.id });
    teamFixture.set(f.team_a, { opponentTeam: f.team_h, wasHome: false, fixture: f.id });
  }

  const rows: PlayerGwFactRow[] = [];
  for (const el of bootstrap.elements) {
    const fix = teamFixture.get(el.team);
    if (!fix) continue;
    rows.push({
      season,
      round: targetEvent,
      element: el.id,
      fixture: fix.fixture,
      teamId: el.team,
      position: POSITION_MAP[el.element_type] ?? 'MID',
      minutes: 0,
      starts: 0,
      goals: 0,
      assists: 0,
      totalPoints: 0,
      xp: Number(el.ep_next) || 0,
      expectedGoals: 0,
      expectedAssists: 0,
      defensiveContribution: 0,
      opponentTeam: fix.opponentTeam,
      wasHome: fix.wasHome,
    });
  }
  return rows;
}

export async function loadCurrentSeasonFacts(
  db: Db,
  season: string,
  targetEvent: number,
  bootstrap: FPLBootstrapStatic,
): Promise<PlayerGwFactRow[]> {
  const [historyFacts, fixtures] = await Promise.all([
    loadCurrentSeasonFactsFromCache(db, season),
    getOrFetchAllFixtures(db),
  ]);

  const hasTargetInHistory = historyFacts.some((f) => f.round === targetEvent);
  if (hasTargetInHistory) {
    console.log(`[pred:score] season=${season} targetEvent=${targetEvent} already in element-summary cache`);
    return historyFacts;
  }

  const targetRows = buildTargetEventRows(bootstrap, fixtures, season, targetEvent);
  console.log(`[pred:score] season=${season} generated ${targetRows.length} target-event rows for GW${targetEvent} from fixtures`);
  return [...historyFacts, ...targetRows];
}
