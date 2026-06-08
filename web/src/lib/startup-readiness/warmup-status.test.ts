import { describe, expect, it } from 'vitest';

import type { HealthResponse } from '@/types';

import {
  isPredictionsWarmupActive,
  isStartupSeedActive,
  shouldPollStartupHealth,
} from './warmup-status';

const baseHealth: HealthResponse = {
  status: 'ok',
  ready: true,
  seed: { phase: 'skipped' },
  lineupsWarmup: {
    phase: 'done',
    ready: true,
    hotDone: 360,
    hotTotal: 360,
    coldDone: 0,
    coldTotal: 0,
    lastError: null,
    startedAt: null,
  },
  predictionsWarmup: {
    phase: 'done',
    ready: true,
    targetEvent: 38,
    lastError: null,
    startedAt: null,
  },
};

describe('warmup-status', () => {
  it('detects active startup seed', () => {
    expect(isStartupSeedActive({ ...baseHealth, seed: { phase: 'running' } })).toBe(true);
    expect(isStartupSeedActive(baseHealth)).toBe(false);
  });

  it('detects active predictions warmup', () => {
    expect(
      isPredictionsWarmupActive({
        ...baseHealth,
        predictionsWarmup: { ...baseHealth.predictionsWarmup, phase: 'score' },
      }),
    ).toBe(true);
    expect(isPredictionsWarmupActive(baseHealth)).toBe(false);
  });

  it('polls health while seed or warmup is active', () => {
    expect(shouldPollStartupHealth(undefined)).toBe(true);
    expect(shouldPollStartupHealth(baseHealth)).toBe(false);
    expect(
      shouldPollStartupHealth({
        ...baseHealth,
        predictionsWarmup: { ...baseHealth.predictionsWarmup, phase: 'ingest' },
      }),
    ).toBe(true);
  });
});
