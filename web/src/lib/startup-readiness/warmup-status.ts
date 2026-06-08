import type { HealthResponse } from '@/types';

function isWarmupPhaseActive(phase: string): boolean {
  return phase !== 'done' && phase !== 'error';
}

export function isStartupSeedActive(health: HealthResponse | undefined): boolean {
  if (!health) return false;
  return health.seed.phase === 'pending' || health.seed.phase === 'running';
}

export function isPredictionsWarmupActive(health: HealthResponse | undefined): boolean {
  if (!health) return false;
  return isWarmupPhaseActive(health.predictionsWarmup.phase);
}

export function isLineupsWarmupActive(health: HealthResponse | undefined): boolean {
  if (!health) return false;
  return isWarmupPhaseActive(health.lineupsWarmup.phase);
}

export function shouldPollStartupHealth(health: HealthResponse | undefined): boolean {
  if (!health) return true;
  return (
    isStartupSeedActive(health) ||
    isPredictionsWarmupActive(health) ||
    isLineupsWarmupActive(health)
  );
}
