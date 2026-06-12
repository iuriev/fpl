import { and, desc, eq, } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import * as cacheLayer from '../cache';
import * as schema from '../db/schema';

const FROZEN_CACHE_TTL_SECONDS = 604800; // 7 days
const SHORT_CACHE_TTL_SECONDS = 300;     // 5 minutes
import type {
  FPLBootstrapStatic,
  FPLDreamTeam,
  FPLHistory,
  FPLLive,
  FPLPicks,
  FPLTransfer,
} from '../fpl-client';
import * as fplClient from '../fpl-client';
import {
  deriveSeason,
  getBootstrapTtlSeconds,
  getLiveTtlSeconds,
  getSeasonState,
  latestFinishedGw,
} from './season';

type Db = PostgresJsDatabase<typeof schema>;

// ─── Bootstrap ───────────────────────────────────────────────────────────────

export async function getOrFetchBootstrap(db: Db): Promise<FPLBootstrapStatic> {
  const memCached = cacheLayer.get<FPLBootstrapStatic>('fpl:bootstrap');
  if (memCached) return memCached;

  const [metaRow] = await db
    .select()
    .from(schema.fplMeta)
    .orderBy(desc(schema.fplMeta.createdAt))
    .limit(1);

  const isComplete = metaRow?.isComplete ?? false;

  const [cached] = await db
    .select()
    .from(schema.fplBootstrapCache)
    .where(
      metaRow
        ? and(eq(schema.fplBootstrapCache.season, metaRow.season), eq(schema.fplBootstrapCache.archived, false))
        : eq(schema.fplBootstrapCache.archived, false),
    )
    .orderBy(desc(schema.fplBootstrapCache.fetchedAt))
    .limit(1);

  if (cached) {
    const bootstrap = cached.data as FPLBootstrapStatic;
    const state = getSeasonState(bootstrap.events, isComplete);
    const ttl = getBootstrapTtlSeconds(state);
    const ageSeconds = (Date.now() - cached.fetchedAt.getTime()) / 1000;
    if (ageSeconds < ttl) {
      cacheLayer.set('fpl:bootstrap', bootstrap, ttl - ageSeconds);
      return bootstrap;
    }
  }

  const bootstrap = await fplClient.getBootstrapStatic();
  const newSeason = deriveSeason(bootstrap.events);

  if (!metaRow || metaRow.season !== newSeason) {
    if (metaRow) {
      await db
        .update(schema.fplBootstrapCache)
        .set({ archived: true })
        .where(eq(schema.fplBootstrapCache.season, metaRow.season));
    }
    await db
      .insert(schema.fplMeta)
      .values({ season: newSeason })
      .onConflictDoNothing();
  }

  await db.insert(schema.fplBootstrapCache).values({
    season: newSeason,
    data: bootstrap as unknown as Record<string, unknown>,
    fetchedAt: new Date(),
    archived: false,
  });

  const gw38 = bootstrap.events.find((e) => e.id === 38);
  const isNowComplete = Boolean(gw38?.finished && gw38.data_checked);
  if (isNowComplete) {
    await db
      .update(schema.fplMeta)
      .set({ isComplete: true })
      .where(eq(schema.fplMeta.season, newSeason));
  }

  const newState = getSeasonState(bootstrap.events, isNowComplete);
  cacheLayer.set('fpl:bootstrap', bootstrap, getBootstrapTtlSeconds(newState));
  return bootstrap;
}

// ─── Season meta helper ──────────────────────────────────────────────────────

export async function getSeasonMeta(db: Db, season: string): Promise<{ isComplete: boolean }> {
  const [metaRow] = await db
    .select()
    .from(schema.fplMeta)
    .where(eq(schema.fplMeta.season, season))
    .limit(1);
  return { isComplete: metaRow?.isComplete ?? false };
}

// ─── GW live ─────────────────────────────────────────────────────────────────

export async function getOrFetchGwLive(
  db: Db,
  season: string,
  gw: number,
  bootstrapEvents: FPLBootstrapStatic['events'],
): Promise<FPLLive> {
  const memKey = `fpl:live:${season}:${gw}`;
  const memCached = cacheLayer.get<FPLLive>(memKey);
  if (memCached) return memCached;

  const [cached] = await db
    .select()
    .from(schema.fplGwLiveCache)
    .where(and(eq(schema.fplGwLiveCache.season, season), eq(schema.fplGwLiveCache.gw, gw)))
    .limit(1);

  if (cached) {
    if (cached.frozen) {
      cacheLayer.set(memKey, cached.data as FPLLive, FROZEN_CACHE_TTL_SECONDS);
      return cached.data as FPLLive;
    }
    const ageSeconds = (Date.now() - cached.fetchedAt.getTime()) / 1000;
    if (ageSeconds < getLiveTtlSeconds()) {
      cacheLayer.set(memKey, cached.data as FPLLive, getLiveTtlSeconds() - ageSeconds);
      return cached.data as FPLLive;
    }
  }

  const data = await fplClient.getLive(gw);
  const event = bootstrapEvents.find((e) => e.id === gw);
  const frozen = Boolean(event?.data_checked);

  await db
    .insert(schema.fplGwLiveCache)
    .values({ season, gw, data: data as unknown as Record<string, unknown>, frozen, fetchedAt: new Date() })
    .onConflictDoUpdate({
      target: [schema.fplGwLiveCache.season, schema.fplGwLiveCache.gw],
      set: { data: data as unknown as Record<string, unknown>, frozen, fetchedAt: new Date() },
    });

  cacheLayer.set(memKey, data, frozen ? FROZEN_CACHE_TTL_SECONDS : getLiveTtlSeconds());
  return data;
}

// ─── Squad picks ─────────────────────────────────────────────────────────────

export async function getOrFetchSquad(
  db: Db,
  season: string,
  teamId: number,
  gw: number,
  bootstrapEvents: FPLBootstrapStatic['events'],
): Promise<FPLPicks> {
  const memKey = `fpl:squad:${season}:${teamId}:${gw}`;
  const memCached = cacheLayer.get<FPLPicks>(memKey);
  if (memCached) return memCached;

  const [cached] = await db
    .select()
    .from(schema.fplSquadCache)
    .where(
      and(
        eq(schema.fplSquadCache.season, season),
        eq(schema.fplSquadCache.teamId, teamId),
        eq(schema.fplSquadCache.gw, gw),
      ),
    )
    .limit(1);

  if (cached) {
    if (cached.frozen) {
      cacheLayer.set(memKey, cached.data as FPLPicks, FROZEN_CACHE_TTL_SECONDS);
      return cached.data as FPLPicks;
    }
    const ageSeconds = (Date.now() - cached.fetchedAt.getTime()) / 1000;
    if (ageSeconds < getLiveTtlSeconds()) {
      cacheLayer.set(memKey, cached.data as FPLPicks, SHORT_CACHE_TTL_SECONDS);
      return cached.data as FPLPicks;
    }
  }

  const data = await fplClient.getPicks(teamId, gw);
  const event = bootstrapEvents.find((e) => e.id === gw);
  const frozen = Boolean(event?.finished && event.data_checked);

  await db
    .insert(schema.fplSquadCache)
    .values({
      season,
      teamId,
      gw,
      data: data as unknown as Record<string, unknown>,
      frozen,
      fetchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.fplSquadCache.season, schema.fplSquadCache.teamId, schema.fplSquadCache.gw],
      set: { data: data as unknown as Record<string, unknown>, frozen, fetchedAt: new Date() },
    });

  cacheLayer.set(memKey, data, frozen ? FROZEN_CACHE_TTL_SECONDS : SHORT_CACHE_TTL_SECONDS);
  return data;
}

// ─── Dream team ──────────────────────────────────────────────────────────────

export async function getOrFetchDreamTeam(
  db: Db,
  season: string,
  gw: number,
  bootstrapEvents: FPLBootstrapStatic['events'],
): Promise<FPLDreamTeam> {
  const [cached] = await db
    .select()
    .from(schema.fplDreamTeamCache)
    .where(and(eq(schema.fplDreamTeamCache.season, season), eq(schema.fplDreamTeamCache.gw, gw)))
    .limit(1);

  if (cached) {
    if (cached.frozen) return cached.data as FPLDreamTeam;
    const ageSeconds = (Date.now() - cached.fetchedAt.getTime()) / 1000;
    if (ageSeconds < getLiveTtlSeconds()) return cached.data as FPLDreamTeam;
  }

  const data = await fplClient.getDreamTeam(gw);
  const event = bootstrapEvents.find((e) => e.id === gw);
  const frozen = Boolean(event?.finished);

  await db
    .insert(schema.fplDreamTeamCache)
    .values({ season, gw, data: data as unknown as Record<string, unknown>, frozen, fetchedAt: new Date() })
    .onConflictDoUpdate({
      target: [schema.fplDreamTeamCache.season, schema.fplDreamTeamCache.gw],
      set: { data: data as unknown as Record<string, unknown>, frozen, fetchedAt: new Date() },
    });

  return data;
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function getOrFetchHistory(
  db: Db,
  season: string,
  teamId: number,
  bootstrapEvents: FPLBootstrapStatic['events'],
  isComplete: boolean,
): Promise<FPLHistory> {
  const memKey = `fpl:history:${season}:${teamId}`;
  const memCached = cacheLayer.get<FPLHistory>(memKey);
  if (memCached) return memCached;

  const [cached] = await db
    .select()
    .from(schema.fplHistoryCache)
    .where(
      and(eq(schema.fplHistoryCache.season, season), eq(schema.fplHistoryCache.teamId, teamId)),
    )
    .limit(1);

  const currentLatestFinishedGw = latestFinishedGw(bootstrapEvents) ?? 0;

  if (cached) {
    if (isComplete) {
      cacheLayer.set(memKey, cached.data as FPLHistory, FROZEN_CACHE_TTL_SECONDS);
      return cached.data as FPLHistory;
    }
    if (cached.lastFinishedGw >= currentLatestFinishedGw) {
      cacheLayer.set(memKey, cached.data as FPLHistory, SHORT_CACHE_TTL_SECONDS);
      return cached.data as FPLHistory;
    }
  }

  const data = await fplClient.getHistory(teamId);

  await db
    .insert(schema.fplHistoryCache)
    .values({
      season,
      teamId,
      data: data as unknown as Record<string, unknown>,
      lastFinishedGw: currentLatestFinishedGw,
      fetchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.fplHistoryCache.season, schema.fplHistoryCache.teamId],
      set: {
        data: data as unknown as Record<string, unknown>,
        lastFinishedGw: currentLatestFinishedGw,
        fetchedAt: new Date(),
      },
    });

  cacheLayer.set(memKey, data, isComplete ? FROZEN_CACHE_TTL_SECONDS : SHORT_CACHE_TTL_SECONDS);
  return data;
}

// ─── Transfers ───────────────────────────────────────────────────────────────

export async function getOrFetchTransfers(
  db: Db,
  season: string,
  teamId: number,
  bootstrapEvents: FPLBootstrapStatic['events'],
  isComplete: boolean,
): Promise<FPLTransfer[]> {
  const memKey = `fpl:transfers:${season}:${teamId}`;
  const memCached = cacheLayer.get<FPLTransfer[]>(memKey);
  if (memCached) return memCached;

  const [cached] = await db
    .select()
    .from(schema.fplTransfersCache)
    .where(
      and(
        eq(schema.fplTransfersCache.season, season),
        eq(schema.fplTransfersCache.teamId, teamId),
      ),
    )
    .limit(1);

  const currentLatestFinishedGw = latestFinishedGw(bootstrapEvents) ?? 0;

  if (cached) {
    if (isComplete) {
      cacheLayer.set(memKey, cached.data as FPLTransfer[], FROZEN_CACHE_TTL_SECONDS);
      return cached.data as FPLTransfer[];
    }
    if (cached.lastFinishedGw >= currentLatestFinishedGw) {
      cacheLayer.set(memKey, cached.data as FPLTransfer[], SHORT_CACHE_TTL_SECONDS);
      return cached.data as FPLTransfer[];
    }
  }

  const data = await fplClient.getTransfers(teamId);

  await db
    .insert(schema.fplTransfersCache)
    .values({
      season,
      teamId,
      data: data as unknown as Record<string, unknown>,
      lastFinishedGw: currentLatestFinishedGw,
      fetchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.fplTransfersCache.season, schema.fplTransfersCache.teamId],
      set: {
        data: data as unknown as Record<string, unknown>,
        lastFinishedGw: currentLatestFinishedGw,
        fetchedAt: new Date(),
      },
    });

  cacheLayer.set(memKey, data, isComplete ? FROZEN_CACHE_TTL_SECONDS : SHORT_CACHE_TTL_SECONDS);
  return data;
}
