import { isLineupsSeedOnStartEnabled } from './lineups-seed-on-start';
import {
  getLineupsWarmupStatus,
  isLineupsWarmupEnabled,
  type LineupsWarmupStatus,
} from './lineups-warmup';

export type StartupSeedPhase = 'pending' | 'running' | 'done' | 'skipped';

export interface StartupReadiness {
  ready: boolean;
  seed: { phase: StartupSeedPhase };
  lineupsWarmup: LineupsWarmupStatus;
}

let seedPhase: StartupSeedPhase = isLineupsSeedOnStartEnabled() ? 'pending' : 'skipped';

export function setStartupSeedRunning(): void {
  if (seedPhase === 'pending') seedPhase = 'running';
}

export function setStartupSeedDone(): void {
  if (seedPhase === 'pending' || seedPhase === 'running') seedPhase = 'done';
}

export function isStartupReady(
  seed: StartupSeedPhase = seedPhase,
  lineupsWarmup: LineupsWarmupStatus = getLineupsWarmupStatus()
): boolean {
  if (seed === 'pending' || seed === 'running') return false;
  if (!isLineupsWarmupEnabled()) return true;
  if (lineupsWarmup.phase === 'error') return true;
  return lineupsWarmup.phase === 'done';
}

export function getStartupReadiness(): StartupReadiness {
  const lineupsWarmup = getLineupsWarmupStatus();
  return {
    ready: isStartupReady(seedPhase, lineupsWarmup),
    seed: { phase: seedPhase },
    lineupsWarmup,
  };
}
