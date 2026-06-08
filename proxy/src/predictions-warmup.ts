import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import * as schema from './db/schema';
import { predictionsWarmupFlagLog } from './flagged-log';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
import { deriveSeason } from './fpl-cache/season';
import { defaultDataDir } from './prediction/ingest';
import { runPredictionIngest } from './prediction/run-ingest';
import { runScoreGameweek } from './prediction/score';
import { resolveNextGw } from './resolve-next-gw';
import { isShuttingDown } from './shutdown';

type Db = PostgresJsDatabase<typeof schema>;

export type PredictionsWarmupPhase = 'idle' | 'ingest' | 'score' | 'done' | 'error';

export interface PredictionsWarmupStatus {
  phase: PredictionsWarmupPhase;
  ready: boolean;
  targetEvent: number | null;
  lastError: string | null;
  startedAt: string | null;
}

const status: PredictionsWarmupStatus = {
  phase: 'idle',
  ready: false,
  targetEvent: null,
  lastError: null,
  startedAt: null,
};

let running = false;

export function isPredictionsWarmupEnabled(): boolean {
  return process.env.PREDICTIONS_WARMUP_ENABLED !== 'false';
}

export function getPredictionsWarmupStatus(): PredictionsWarmupStatus {
  return { ...status };
}

function logWarmup(message: string): void {
  predictionsWarmupFlagLog.log(message);
}

export async function runPredictionsWarmup(db: Db): Promise<void> {
  if (!isPredictionsWarmupEnabled()) {
    status.phase = 'done';
    status.ready = true;
    logWarmup('disabled via PREDICTIONS_WARMUP_ENABLED=false');
    return;
  }

  if (running) return;
  running = true;
  status.startedAt = new Date().toISOString();
  status.phase = 'ingest';
  status.ready = false;
  status.lastError = null;

  try {
    if (isShuttingDown()) return;

    const bootstrap = await getOrFetchBootstrap(db);
    const targetEvent = resolveNextGw(bootstrap);
    const season = deriveSeason(bootstrap.events);
    status.targetEvent = targetEvent;

    logWarmup(`ingest starting for season=${season} targetEvent=${targetEvent}`);
    await runPredictionIngest(db, defaultDataDir(), undefined, ['PREDICTIONS_WARMUP_ENABLED']);
    if (isShuttingDown()) return;

    status.phase = 'score';
    logWarmup(`score starting event=${targetEvent} season=${season}`);
    await runScoreGameweek(db, season, targetEvent, defaultDataDir());

    status.phase = 'done';
    status.ready = true;
    logWarmup(`done event=${targetEvent}`);
  } catch (err) {
    status.phase = 'error';
    status.ready = false;
    status.lastError = err instanceof Error ? err.message : String(err);
    predictionsWarmupFlagLog.error('error:', err);
  } finally {
    running = false;
  }
}

export function startPredictionsWarmup(db: Db): void {
  if (!isPredictionsWarmupEnabled()) {
    status.phase = 'done';
    status.ready = true;
    return;
  }

  logWarmup('scheduling background warmup');
  void runPredictionsWarmup(db);
}
