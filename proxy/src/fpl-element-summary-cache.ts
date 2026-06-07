import { and, eq, gt, inArray, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import * as cacheLayer from './cache';
import * as schema from './db/schema';
import type { FPLElementSummary } from './fpl-client';
import { getElementSummary } from './fpl-client';
import type { FplFetchPriority } from './fpl-request-queue';

type Db = PostgresJsDatabase<typeof schema>;

export const ELEMENT_SUMMARY_TTL_SECONDS = cacheLayer.ttl.ELEMENT_SUMMARY;

export async function getFreshElementSummaryRow(
  db: Db,
  season: string,
  elementId: number
): Promise<FPLElementSummary | null> {
  const [row] = await db
    .select()
    .from(schema.fplElementSummaryCache)
    .where(
      and(
        eq(schema.fplElementSummaryCache.season, season),
        eq(schema.fplElementSummaryCache.elementId, elementId)
      )
    )
    .limit(1);

  if (!row) return null;
  const ageSeconds = (Date.now() - row.fetchedAt.getTime()) / 1000;
  if (ageSeconds >= ELEMENT_SUMMARY_TTL_SECONDS) return null;

  return row.data as FPLElementSummary;
}

export async function getCachedElementSummary(
  db: Db,
  season: string,
  elementId: number
): Promise<FPLElementSummary | undefined> {
  const memKey = `element-summary:${elementId}`;
  const memCached = cacheLayer.get<FPLElementSummary>(memKey);
  if (memCached) return memCached;

  const dbCached = await getFreshElementSummaryRow(db, season, elementId);
  if (!dbCached) return undefined;

  cacheLayer.set(memKey, dbCached, ELEMENT_SUMMARY_TTL_SECONDS);
  return dbCached;
}

export async function getOrFetchElementSummary(
  db: Db,
  season: string,
  elementId: number,
  priority: FplFetchPriority = 'interactive'
): Promise<FPLElementSummary> {
  const memKey = `element-summary:${elementId}`;
  const memCached = cacheLayer.get<FPLElementSummary>(memKey);
  if (memCached) return memCached;

  const dbCached = await getFreshElementSummaryRow(db, season, elementId);
  if (dbCached) {
    cacheLayer.set(memKey, dbCached, ELEMENT_SUMMARY_TTL_SECONDS);
    return dbCached;
  }

  const data = await getElementSummary(elementId, priority);
  const fetchedAt = new Date();
  await db
    .insert(schema.fplElementSummaryCache)
    .values({
      season,
      elementId,
      data: data as unknown as Record<string, unknown>,
      fetchedAt,
    })
    .onConflictDoUpdate({
      target: [schema.fplElementSummaryCache.season, schema.fplElementSummaryCache.elementId],
      set: {
        data: data as unknown as Record<string, unknown>,
        fetchedAt,
      },
    });

  cacheLayer.set(memKey, data, ELEMENT_SUMMARY_TTL_SECONDS);
  return data;
}

export async function getBulkFreshElementSummaries(
  db: Db,
  season: string,
  elementIds: number[]
): Promise<Map<number, FPLElementSummary>> {
  if (elementIds.length === 0) return new Map();
  const cutoff = new Date(Date.now() - ELEMENT_SUMMARY_TTL_SECONDS * 1000);
  const rows = await db
    .select()
    .from(schema.fplElementSummaryCache)
    .where(
      and(
        eq(schema.fplElementSummaryCache.season, season),
        inArray(schema.fplElementSummaryCache.elementId, elementIds),
        gt(schema.fplElementSummaryCache.fetchedAt, cutoff)
      )
    );
  const result = new Map<number, FPLElementSummary>();
  for (const row of rows) {
    const data = row.data as FPLElementSummary;
    result.set(row.elementId, data);
    cacheLayer.set(`element-summary:${row.elementId}`, data, ELEMENT_SUMMARY_TTL_SECONDS);
  }
  return result;
}

export async function countFreshSummaries(
  db: Db,
  season: string,
  elementIds: number[]
): Promise<number> {
  if (elementIds.length === 0) return 0;
  const cutoff = new Date(Date.now() - ELEMENT_SUMMARY_TTL_SECONDS * 1000);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.fplElementSummaryCache)
    .where(
      and(
        eq(schema.fplElementSummaryCache.season, season),
        inArray(schema.fplElementSummaryCache.elementId, elementIds),
        gt(schema.fplElementSummaryCache.fetchedAt, cutoff)
      )
    );
  return Number(row?.count ?? 0);
}
