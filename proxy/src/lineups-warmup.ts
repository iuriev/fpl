import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import * as schema from './db/schema';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
import { deriveSeason } from './fpl-cache/season';
import * as fplClient from './fpl-client';
import {
  countFreshSummaries,
  getFreshElementSummaryRow,
  getOrFetchElementSummary,
} from './fpl-element-summary-cache';
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

async function fetchFixturesBackground(): Promise<void> {
  await fplClient.getFixturesAll('background');
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
    status.phase = 'waiting';
    await sleep(startDelayMs());

    status.phase = 'fixtures';
    await fetchFixturesBackground();

    const bootstrap = await getOrFetchBootstrap(db);
    const season = deriveSeason(bootstrap.events);
    const hotIds = hotElementIdsPerTeam(bootstrap, hotPerTeam());
    const hotSet = new Set(hotIds);
    const coldIds = coldElementIds(bootstrap, hotSet);

    status.hotTotal = hotIds.length;
    status.hotDone = await countFreshSummaries(db, season, hotIds);
    status.phase = 'hot';
    await warmElementIds(db, season, hotIds, (done) => {
      status.hotDone = done;
    });

    status.ready = status.hotDone >= status.hotTotal;
    status.phase = 'lineups_hot';
    await predictedLineupService.getPredictedLineups();

    status.coldTotal = coldIds.length;
    status.coldDone = await countFreshSummaries(db, season, coldIds);
    status.phase = 'cold';
    await warmElementIds(db, season, coldIds, (done) => {
      status.coldDone = done;
    });

    status.phase = 'lineups_full';
    await predictedLineupService.getPredictedLineups();

    status.phase = 'done';
    status.ready = true;
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
