import { describe, expect, it } from 'vitest';

import type { HealthResponse } from '@/types';

import { startupProgressPercent } from './startup-progress';

const baseHealth: HealthResponse = {
  status: 'ok',
  ready: false,
  seed: { phase: 'skipped' },
  lineupsWarmup: {
    phase: 'hot',
    ready: false,
    hotDone: 90,
    hotTotal: 360,
    coldDone: 0,
    coldTotal: 100,
    lastError: null,
    startedAt: null,
  },
};

describe('startupProgressPercent', () => {
  it('returns null while seed runs', () => {
    expect(
      startupProgressPercent({ ...baseHealth, seed: { phase: 'running' } })
    ).toBeNull();
  });

  it('returns a bounded percent during warmup', () => {
    const pct = startupProgressPercent(baseHealth);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });

  it('returns 100 when warmup finished', () => {
    expect(
      startupProgressPercent({
        ...baseHealth,
        lineupsWarmup: { ...baseHealth.lineupsWarmup, phase: 'done' },
      })
    ).toBe(100);
  });
});
