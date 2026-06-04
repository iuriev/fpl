import { and, desc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import * as schema from './db/schema';
import { countsFromStarters, type FormationCounts } from './formation-inference';
import type { FPLBootstrapStatic, FPLLive } from './fpl-client';

type Db = PostgresJsDatabase<typeof schema>;

export function priorSeasonKey(season: string): string | null {
  const match = season.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const startYear = Number(match[1]);
  return `${startYear - 1}-${String(startYear).slice(-2)}`;
}

export function lastDataCheckedGw(bootstrap: FPLBootstrapStatic): number | null {
  const checked = bootstrap.events.filter((e) => e.finished && e.data_checked);
  if (checked.length === 0) return null;
  return checked[checked.length - 1].id;
}

function statValue(
  explain: FPLLive['elements'][0]['explain'][0] | undefined,
  identifier: string
): number {
  return explain?.stats.find((s) => s.identifier === identifier)?.value ?? 0;
}

export function playerStartedInLiveFixture(
  liveEl: FPLLive['elements'][0] | undefined,
  fixtureId: number
): boolean {
  if (!liveEl) return false;
  const row = liveEl.explain.find((e) => e.fixture === fixtureId);
  if (!row) return false;
  const starts = statValue(row, 'starts');
  if (starts > 0) return true;
  return statValue(row, 'minutes') >= 60;
}

export function lastFixtureIdForTeamInGwLive(
  teamId: number,
  elements: FPLBootstrapStatic['elements'],
  liveByElementId: Map<number, FPLLive['elements'][0]>
): number | null {
  const fixtureIds: number[] = [];
  for (const el of elements) {
    if (el.team !== teamId) continue;
    const liveEl = liveByElementId.get(el.id);
    if (!liveEl) continue;
    for (const row of liveEl.explain) {
      if (statValue(row, 'minutes') > 0) fixtureIds.push(row.fixture);
    }
  }
  if (fixtureIds.length === 0) return null;
  return Math.max(...fixtureIds);
}

export function formationFromGwLiveFixture(
  fixtureId: number,
  teamId: number,
  elements: FPLBootstrapStatic['elements'],
  liveByElementId: Map<number, FPLLive['elements'][0]>
): FormationCounts | null {
  const types: number[] = [];
  for (const el of elements) {
    if (el.team !== teamId) continue;
    if (playerStartedInLiveFixture(liveByElementId.get(el.id), fixtureId)) {
      types.push(el.element_type);
    }
  }
  if (types.filter((t) => t === 1).length !== 1) return null;
  return countsFromStarters(types);
}

async function getArchivedBootstrap(
  db: Db,
  season: string
): Promise<FPLBootstrapStatic | null> {
  const [cached] = await db
    .select()
    .from(schema.fplBootstrapCache)
    .where(eq(schema.fplBootstrapCache.season, season))
    .orderBy(desc(schema.fplBootstrapCache.fetchedAt))
    .limit(1);
  return cached ? (cached.data as FPLBootstrapStatic) : null;
}

async function getFrozenGwLive(
  db: Db,
  season: string,
  gw: number
): Promise<FPLLive | null> {
  const [cached] = await db
    .select()
    .from(schema.fplGwLiveCache)
    .where(
      and(eq(schema.fplGwLiveCache.season, season), eq(schema.fplGwLiveCache.gw, gw))
    )
    .limit(1);
  if (!cached?.frozen) return null;
  return cached.data as FPLLive;
}

async function maxFrozenGwInCache(db: Db, season: string): Promise<number | null> {
  const [row] = await db
    .select({ gw: schema.fplGwLiveCache.gw })
    .from(schema.fplGwLiveCache)
    .where(
      and(eq(schema.fplGwLiveCache.season, season), eq(schema.fplGwLiveCache.frozen, true))
    )
    .orderBy(desc(schema.fplGwLiveCache.gw))
    .limit(1);
  return row?.gw ?? null;
}

async function resolvePreviousSeasonGw(
  db: Db,
  prevSeason: string,
  bootstrap: FPLBootstrapStatic
): Promise<number | null> {
  const fromEvents = lastDataCheckedGw(bootstrap);
  if (fromEvents != null) {
    const live = await getFrozenGwLive(db, prevSeason, fromEvents);
    if (live) return fromEvents;
  }
  return maxFrozenGwInCache(db, prevSeason);
}

export async function loadPreviousSeasonFormationsByTeam(
  db: Db,
  currentSeason: string
): Promise<Map<number, FormationCounts>> {
  const prevSeason = priorSeasonKey(currentSeason);
  if (!prevSeason) return new Map();

  const bootstrap = await getArchivedBootstrap(db, prevSeason);
  if (!bootstrap) return new Map();

  const gw = await resolvePreviousSeasonGw(db, prevSeason, bootstrap);
  if (gw == null) return new Map();

  const live = await getFrozenGwLive(db, prevSeason, gw);
  if (!live) return new Map();

  const liveByElementId = new Map(live.elements.map((e) => [e.id, e]));
  const result = new Map<number, FormationCounts>();

  for (const team of bootstrap.teams) {
    const fixtureId = lastFixtureIdForTeamInGwLive(team.id, bootstrap.elements, liveByElementId);
    if (fixtureId == null) continue;
    const counts = formationFromGwLiveFixture(
      fixtureId,
      team.id,
      bootstrap.elements,
      liveByElementId
    );
    if (counts) result.set(team.id, counts);
  }

  return result;
}
