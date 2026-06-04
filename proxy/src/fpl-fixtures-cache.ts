import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import * as cacheLayer from './cache';
import * as schema from './db/schema';
import { getOrFetchBootstrap, getSeasonMeta } from './fpl-cache/db-cache';
import { deriveSeason, getFixturesTtlSeconds, getSeasonState } from './fpl-cache/season';
import type { FPLFixture } from './fpl-client';
import * as fplClient from './fpl-client';
import type { FplFetchPriority } from './fpl-request-queue';

type Db = PostgresJsDatabase<typeof schema>;

export const FIXTURES_ALL_MEM_KEY = 'fixtures:all';

async function getFreshFixturesRow(
  db: Db,
  season: string,
  ttlSeconds: number
): Promise<FPLFixture[] | null> {
  const [row] = await db
    .select()
    .from(schema.fplFixturesCache)
    .where(eq(schema.fplFixturesCache.season, season))
    .limit(1);

  if (!row) return null;
  const ageSeconds = (Date.now() - row.fetchedAt.getTime()) / 1000;
  if (ageSeconds >= ttlSeconds) return null;

  return row.data as FPLFixture[];
}

export async function getOrFetchAllFixtures(
  db: Db,
  priority: FplFetchPriority = 'interactive'
): Promise<FPLFixture[]> {
  const memCached = cacheLayer.get<FPLFixture[]>(FIXTURES_ALL_MEM_KEY);
  if (memCached) return memCached;

  const bootstrap = await getOrFetchBootstrap(db);
  const season = deriveSeason(bootstrap.events);
  const { isComplete } = await getSeasonMeta(db, season);
  const state = getSeasonState(bootstrap.events, isComplete);
  const ttl = getFixturesTtlSeconds(state);

  if (state === 'complete') {
    const dbCached = await getFreshFixturesRow(db, season, ttl);
    if (dbCached) {
      cacheLayer.set(FIXTURES_ALL_MEM_KEY, dbCached, ttl);
      return dbCached;
    }
  }

  const data = await fplClient.getFixturesAll(priority);
  const fetchedAt = new Date();

  if (state === 'complete') {
    await db
      .insert(schema.fplFixturesCache)
      .values({
        season,
        data: data as unknown as Record<string, unknown>,
        fetchedAt,
      })
      .onConflictDoUpdate({
        target: schema.fplFixturesCache.season,
        set: {
          data: data as unknown as Record<string, unknown>,
          fetchedAt,
        },
      });
  }

  cacheLayer.set(FIXTURES_ALL_MEM_KEY, data, ttl);
  return data;
}
