import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import * as schema from './db/schema';
import { lineupsWarmupFlagLog } from './flagged-log';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
import { deriveSeason } from './fpl-cache/season';
import {
  countFreshSummaries,
  getBulkFreshElementSummaries,
  getOrFetchElementSummary,
} from './fpl-element-summary-cache';
import { getOrFetchAllFixtures } from './fpl-fixtures-cache';
import {
  coldElementIds,
  hotElementIdsPerTeam,
} from './lineups-player-sets';
import * as predictedLineupService from './predicted-lineup-service';
import { isShuttingDown } from './shutdown';

type Db = PostgresJsDatabase<typeof schema>;

export type LineupsWarmupPhase =
  | 'idle'
  | 'waiting'
  | 'fixtures'
  | 'hot'
  | 'cold'
  | 'lineups'
  | 'done'
  | 'error';

export interface LineupsWarmupStatus {
  phase: LineupsWarmupPhase;
  ready: boolean;
  hotDone: number;
  hotTotal: number;
  coldDone: number;
  coldTotal: number;
  lastError: string | null;
  startedAt: string | null;
}

const status: LineupsWarmupStatus = {
  phase: 'idle',
  ready: false,
  hotDone: 0,
  hotTotal: 0,
  coldDone: 0,
  coldTotal: 0,
  lastError: null,
  startedAt: null,
};

let running = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isLineupsWarmupEnabled(): boolean {
  return process.env.LINEUPS_WARMUP_ENABLED !== 'false';
}

function isWarmupEnabled(): boolean {
  return isLineupsWarmupEnabled();
}

function startDelayMs(): number {
  const raw = process.env.LINEUPS_WARMUP_START_DELAY_MS;
  const parsed = raw ? parseInt(raw, 10) : 10_000;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 10_000;
}

function hotPerTeam(): number {
  const raw = process.env.LINEUPS_WARMUP_HOT_PER_TEAM;
  const parsed = raw ? parseInt(raw, 10) : 18;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 18;
}

export function getLineupsWarmupStatus(): LineupsWarmupStatus {
  return { ...status };
}

const PROGRESS_LOG_EVERY = 10;
const HEARTBEAT_MS = 20_000;

function logWarmup(message: string): void {
  lineupsWarmupFlagLog.log(message);
}

export function formatLineupsWarmupStatus(
  s: LineupsWarmupStatus = status
): string {
  const elapsed =
    s.startedAt != null
      ? `${Math.round((Date.now() - new Date(s.startedAt).getTime()) / 1000)}s`
      : '—';
  return (
    `phase=${s.phase} hot=${s.hotDone}/${s.hotTotal} cold=${s.coldDone}/${s.coldTotal} ` +
    `ready=${s.ready} elapsed=${elapsed}`
  );
}

async function sleepWithProgress(delayMs: number): Promise<void> {
  if (delayMs <= 0) return;
  const stepMs = Math.min(500, delayMs);
  let waited = 0;
  while (waited < delayMs) {
    if (isShuttingDown()) return;
    const chunk = Math.min(stepMs, delayMs - waited);
    await sleep(chunk);
    waited += chunk;
    if (waited % 5_000 === 0 || waited >= delayMs) {
      logWarmup(
        `waiting ${waited}/${delayMs}ms before background FPL (predicted lineups return 503 until warmup completes)`
      );
    }
  }
}

async function fetchFixturesBackground(db: Db): Promise<void> {
  await getOrFetchAllFixtures(db, 'background');
}

async function warmElementIds(
  db: Db,
  season: string,
  ids: number[],
  label: string,
  onProgress: (done: number) => void
): Promise<void> {
  if (ids.length === 0) {
    logWarmup(`${label}: no players to warm`);
    return;
  }

  const cachedMap = await getBulkFreshElementSummaries(db, season, ids);

  let done = 0;
  let fetches = 0;
  let lastLogAt = Date.now();

  const maybeLogProgress = (force = false) => {
    const now = Date.now();
    const intervalHit = now - lastLogAt >= HEARTBEAT_MS;
    const stepHit = done % PROGRESS_LOG_EVERY === 0 || done === ids.length;
    if (!force && !stepHit && !intervalHit) return;
    lastLogAt = now;
    const pct = Math.round((done / ids.length) * 100);
    logWarmup(
      `${label} progress ${done}/${ids.length} (${pct}%) — ${fetches} FPL element-summary calls so far`
    );
  };

  logWarmup(`${label}: warming ${ids.length} players… (${cachedMap.size} in DB, ${ids.length - cachedMap.size} need FPL fetch)`);
  maybeLogProgress(true);

  for (const elementId of ids) {
    if (isShuttingDown()) {
      logWarmup(`${label}: stopped early (shutdown)`);
      return;
    }
    if (!cachedMap.has(elementId)) {
      logWarmup(
        `${label} FPL fetch element-summary/${elementId} (${done + 1}/${ids.length}, call #${fetches + 1})`
      );
      await getOrFetchElementSummary(db, season, elementId, 'background');
      fetches++;
    }
    done++;
    onProgress(done);
    maybeLogProgress();
  }

  logWarmup(`${label}: finished — ${fetches} FPL calls, ${ids.length - fetches} already cached`);
}

export async function runLineupsWarmup(db: Db, onComplete?: () => Promise<void>): Promise<void> {
  if (!isWarmupEnabled()) {
    status.phase = 'done';
    status.ready = true;
    return;
  }
  if (running) {
    logWarmup(`already running — ${formatLineupsWarmupStatus()}`);
    return;
  }
  running = true;
  status.startedAt = new Date().toISOString();
  status.lastError = null;
  logWarmup(
    'background warmup started (GET /api/predicted-lineups returns 503 until hot+cold summaries and cache are ready)'
  );

  try {
    if (isShuttingDown()) return;

    const delayMs = startDelayMs();
    status.phase = 'waiting';
    logWarmup(
      `phase=waiting — deferring ${delayMs}ms so interactive FPL traffic goes first`
    );
    await sleepWithProgress(delayMs);
    if (isShuttingDown()) return;

    status.phase = 'fixtures';
    logWarmup('fetching fixtures (background queue, ~5s gap vs other FPL calls)');
    await fetchFixturesBackground(db);
    if (isShuttingDown()) return;
    logWarmup('fixtures cached');

    logWarmup('loading bootstrap for player list');
    const bootstrap = await getOrFetchBootstrap(db);
    const season = deriveSeason(bootstrap.events);
    const hotIds = hotElementIdsPerTeam(bootstrap, hotPerTeam());
    const hotSet = new Set(hotIds);
    const coldIds = coldElementIds(bootstrap, hotSet);

    status.hotTotal = hotIds.length;
    logWarmup(`counting cached summaries for ${hotIds.length} hot players…`);
    status.hotDone = await countFreshSummaries(db, season, hotIds);
    const hotCached = status.hotDone;
    status.phase = 'hot';
    const toFetch = hotIds.length - hotCached;
    logWarmup(
      `hot tier: ${hotIds.length} players (${hotCached} in DB, ${toFetch} need FPL — ~${toFetch * 5}s at 5s/request)`
    );
    if (toFetch === 0) {
      logWarmup('no FPL element-summary calls needed for hot tier');
    }
    await warmElementIds(db, season, hotIds, 'hot', (done) => {
      status.hotDone = done;
    });
    if (isShuttingDown()) return;

    status.hotDone = await countFreshSummaries(db, season, hotIds);

    status.coldTotal = coldIds.length;
    status.coldDone = await countFreshSummaries(db, season, coldIds);
    status.phase = 'cold';
    const coldCached = status.coldDone;
    const coldToFetch = coldIds.length - coldCached;
    logWarmup(
      `cold tier: ${coldIds.length} players (${coldCached} in DB, ${coldToFetch} need FPL — ~${coldToFetch * 5}s at 5s/request)`
    );
    if (coldToFetch === 0) {
      logWarmup('no FPL element-summary calls needed for cold tier');
    }
    await warmElementIds(db, season, coldIds, 'cold', (done) => {
      status.coldDone = done;
    });
    if (isShuttingDown()) return;

    status.coldDone = await countFreshSummaries(db, season, coldIds);
    status.phase = 'lineups';
    logWarmup(
      `phase=lineups (${formatLineupsWarmupStatus()}) — building predicted-lineups cache with hot+cold summaries`
    );
    const lineupsCacheStart = Date.now();
    await predictedLineupService.getPredictedLineups(undefined, {
      skipReadyGuard: true,
    });
    if (isShuttingDown()) return;
    logWarmup(
      `predicted-lineups cache ready in ${Date.now() - lineupsCacheStart}ms — API may return 200 now`
    );

    status.phase = 'done';
    status.ready = true;
    logWarmup(`phase=done — warmup complete (${formatLineupsWarmupStatus()})`);

    if (onComplete) {
      try {
        await onComplete();
      } catch (err) {
        lineupsWarmupFlagLog.error('onComplete error:', err);
      }
    }
  } catch (err) {
    status.phase = 'error';
    status.lastError = err instanceof Error ? err.message : String(err);
    lineupsWarmupFlagLog.error('error:', err);
  } finally {
    running = false;
  }
}

export function startLineupsWarmup(db: Db, onComplete?: () => Promise<void>): void {
  if (!isWarmupEnabled()) {
    status.phase = 'done';
    status.ready = true;
    logWarmup('disabled (LINEUPS_WARMUP_ENABLED=false)');
    return;
  }
  logWarmup('scheduling background warmup after bootstrap is available');
  void runLineupsWarmup(db, onComplete);
}
