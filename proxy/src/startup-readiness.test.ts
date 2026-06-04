import { describe, expect, it } from 'vitest';

import type { LineupsWarmupStatus } from './lineups-warmup';
import { isStartupReady } from './startup-readiness';

const idleWarmup: LineupsWarmupStatus = {
  phase: 'idle',
  ready: false,
  hotDone: 0,
  hotTotal: 0,
  coldDone: 0,
  coldTotal: 0,
  lastError: null,
  startedAt: null,
};

const doneWarmup: LineupsWarmupStatus = {
  ...idleWarmup,
  phase: 'done',
  ready: true,
  hotDone: 360,
  hotTotal: 360,
};

describe('isStartupReady', () => {
  it('is false while seed is pending or running', () => {
    expect(isStartupReady('pending', doneWarmup)).toBe(false);
    expect(isStartupReady('running', doneWarmup)).toBe(false);
  });

  it('is true when seed is skipped and warmup finished', () => {
    expect(isStartupReady('skipped', doneWarmup)).toBe(true);
    expect(isStartupReady('done', doneWarmup)).toBe(true);
  });

  it('is false while warmup is in progress', () => {
    expect(isStartupReady('skipped', { ...idleWarmup, phase: 'hot', hotDone: 50, hotTotal: 360 })).toBe(
      false
    );
  });

  it('fails open when warmup errored', () => {
    expect(isStartupReady('skipped', { ...idleWarmup, phase: 'error', lastError: 'boom' })).toBe(true);
  });
});
