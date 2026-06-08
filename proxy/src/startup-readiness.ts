import { isLineupsSeedOnStartEnabled } from './lineups-seed-on-start';
import { getLineupsWarmupStatus, type LineupsWarmupStatus } from './lineups-warmup';
import { getPredictionsWarmupStatus, type PredictionsWarmupStatus } from './predictions-warmup';

export type StartupSeedPhase = 'pending' | 'running' | 'done' | 'skipped';

export interface StartupReadiness {
  ready: boolean;
  seed: { phase: StartupSeedPhase };
  lineupsWarmup: LineupsWarmupStatus;
  predictionsWarmup: PredictionsWarmupStatus;
}

let seedPhase: StartupSeedPhase = isLineupsSeedOnStartEnabled() ? 'pending' : 'skipped';

export function setStartupSeedRunning(): void {
  if (seedPhase === 'pending') seedPhase = 'running';
}

export function setStartupSeedDone(): void {
  if (seedPhase === 'pending' || seedPhase === 'running') seedPhase = 'done';
}

function isWarmupBlocking(warmup: { ready: boolean; phase: string }): boolean {
  if (warmup.ready) return false;
  if (warmup.phase === 'error') return false;
  return true;
}

export function isStartupReady(
  seed: StartupSeedPhase = seedPhase,
  lineupsWarmup: LineupsWarmupStatus = getLineupsWarmupStatus(),
  predictionsWarmup: PredictionsWarmupStatus = getPredictionsWarmupStatus(),
): boolean {
  if (seed === 'pending' || seed === 'running') return false;
  if (isWarmupBlocking(lineupsWarmup)) return false;
  if (isWarmupBlocking(predictionsWarmup)) return false;
  return true;
}

export function getStartupReadiness(): StartupReadiness {
  const lineupsWarmup = getLineupsWarmupStatus();
  const predictionsWarmup = getPredictionsWarmupStatus();
  return {
    ready: isStartupReady(seedPhase, lineupsWarmup, predictionsWarmup),
    seed: { phase: seedPhase },
    lineupsWarmup,
    predictionsWarmup,
  };
}
