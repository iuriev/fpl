import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import * as schema from '../db/schema';
import type { FPLBootstrapStatic } from '../fpl-client';
import * as fplClient from '../fpl-client';

type Db = PostgresJsDatabase<typeof schema>;

const MAX_PREFETCH = 10;
const RATE_LIMIT_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function prefetchMissingGwData(
  db: Db,
  season: string,
  bootstrapEvents: FPLBootstrapStatic['events'],
): Promise<void> {
  const frozenGws = bootstrapEvents
    .filter((e) => e.finished && e.data_checked)
    .map((e) => e.id);

  if (frozenGws.length === 0) return;

  const [existingLive, existingDreamTeam] = await Promise.all([
    db
      .select({ gw: schema.fplGwLiveCache.gw })
      .from(schema.fplGwLiveCache)
      .where(and(eq(schema.fplGwLiveCache.season, season), eq(schema.fplGwLiveCache.frozen, true))),
    db
      .select({ gw: schema.fplDreamTeamCache.gw })
      .from(schema.fplDreamTeamCache)
      .where(
        and(eq(schema.fplDreamTeamCache.season, season), eq(schema.fplDreamTeamCache.frozen, true)),
      ),
  ]);

  const liveGws = new Set(existingLive.map((r) => r.gw));
  const dreamTeamGws = new Set(existingDreamTeam.map((r) => r.gw));

  let fetches = 0;

  for (const gw of frozenGws) {
    if (fetches >= MAX_PREFETCH) break;

    if (!liveGws.has(gw)) {
      if (fetches > 0) await sleep(RATE_LIMIT_MS);
      try {
        const data = await fplClient.getLive(gw);
        await db
          .insert(schema.fplGwLiveCache)
          .values({
            season,
            gw,
            data: data as unknown as Record<string, unknown>,
            frozen: true,
            fetchedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [schema.fplGwLiveCache.season, schema.fplGwLiveCache.gw],
            set: {
              data: data as unknown as Record<string, unknown>,
              frozen: true,
              fetchedAt: new Date(),
            },
          });
        console.log(`[prefetch] GW ${gw} live data cached`);
      } catch (err) {
        console.error(`[prefetch] Failed to fetch live data for GW ${gw}:`, err);
      }
      fetches++;
      if (fetches >= MAX_PREFETCH) break;
    }

    if (!dreamTeamGws.has(gw)) {
      if (fetches > 0) await sleep(RATE_LIMIT_MS);
      try {
        const data = await fplClient.getDreamTeam(gw);
        await db
          .insert(schema.fplDreamTeamCache)
          .values({
            season,
            gw,
            data: data as unknown as Record<string, unknown>,
            frozen: true,
            fetchedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [schema.fplDreamTeamCache.season, schema.fplDreamTeamCache.gw],
            set: {
              data: data as unknown as Record<string, unknown>,
              frozen: true,
              fetchedAt: new Date(),
            },
          });
        console.log(`[prefetch] GW ${gw} dream team cached`);
      } catch (err) {
        console.error(`[prefetch] Failed to fetch dream team for GW ${gw}:`, err);
      }
      fetches++;
    }
  }
}
