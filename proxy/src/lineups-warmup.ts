import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import * as schema from './db/schema';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
import { deriveSeason } from './fpl-cache/season';
import {
  countFreshSummaries,
  getFreshElementSummaryRow,
  getOrFetchElementSummary,
} from './fpl-element-summary-cache';
import { getOrFetchAllFixtures } from './fpl-fixtures-cache';
import {
  coldElementIds,
  hotElementIdsPerTeam,
} from './lineups-player-sets';
import * as predictedLineupService from './predicted-lineup-service';

type Db = PostgresJsDatabase<typeof schema>;

export type LineupsWarmupPhase =
  | 'idle'
  | 'waiting'
  | 'fixtures'
  | 'hot'
  | 'lineups_hot'
  | 'cold'
  | 'lineups_full'
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

function isWarmupEnabled(): boolean {
  return process.env.LINEUPS_WARMUP_ENABLED !== 'false';
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

function logWarmup(message: string): void {
  console.log(`[lineups:warmup] ${message}`);
}

async function fetchFixturesBackground(db: Db): Promise<void> {
  await getOrFetchAllFixtures(db, 'background');
}

async function warmElementIds(
  db: Db,
  season: string,
  ids: number[],
  onProgress: (done: number) => void
): Promise<void> {
  let done = 0;
  for (const elementId of ids) {
    const fresh = await getFreshElementSummaryRow(db, season, elementId);
    if (!fresh) {
      logWarmup(`fetch element-summary/${elementId} (${done + 1}/${ids.length})`);
      await getOrFetchElementSummary(db, season, elementId, 'background');
    }
    done++;
    onProgress(done);
  }
}

export async function runLineupsWarmup(db: Db): Promise<void> {
  if (!isWarmupEnabled()) {
    status.phase = 'idle';
    return;
  }
  if (running) return;
  running = true;
  status.startedAt = new Date().toISOString();
  status.lastError = null;

  try {
    const delayMs = startDelayMs();
    status.phase = 'waiting';
    logWarmup(`started — waiting ${delayMs}ms before FPL (interactive API traffic goes first)`);
    await sleep(delayMs);

    status.phase = 'fixtures';
    logWarmup('fetching fixtures (background queue, ~5s gap vs other FPL calls)');
    await fetchFixturesBackground(db);
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
    await warmElementIds(db, season, hotIds, (done) => {
      status.hotDone = done;
    });

    status.hotDone = await countFreshSummaries(db, season, hotIds);
    status.ready = status.hotDone >= status.hotTotal;
    status.phase = 'lineups_hot';
    logWarmup(`ready=${status.ready} — building predicted-lineups cache`);
    await predictedLineupService.getPredictedLineups(undefined, { skipReadyGuard: true });

    status.coldTotal = coldIds.length;
    status.coldDone = await countFreshSummaries(db, season, coldIds);
    status.phase = 'cold';
    logWarmup(`cold tier: ${coldIds.length} players (${status.coldDone} already cached)`);
    await warmElementIds(db, season, coldIds, (done) => {
      status.coldDone = done;
    });

    status.phase = 'lineups_full';
    logWarmup('refreshing full predicted-lineups cache');
    await predictedLineupService.getPredictedLineups(undefined, { skipReadyGuard: true });

    status.phase = 'done';
    status.ready = true;
    logWarmup('done');
  } catch (err) {
    status.phase = 'error';
    status.lastError = err instanceof Error ? err.message : String(err);
    console.error('[lineups:warmup] error:', err);
  } finally {
    running = false;
  }
}

export function startLineupsWarmup(db: Db): void {
  if (!isWarmupEnabled()) return;
  void runLineupsWarmup(db);
}
