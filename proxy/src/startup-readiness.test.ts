import { describe, expect, it } from 'vitest';

import type { LineupsWarmupStatus } from './lineups-warmup';
import type { PredictionsWarmupStatus } from './predictions-warmup';
import { isStartupReady } from './startup-readiness';

const idlePredictionsWarmup: PredictionsWarmupStatus = {
  phase: 'idle',
  ready: false,
  targetEvent: null,
  lastError: null,
  startedAt: null,
};

const donePredictionsWarmup: PredictionsWarmupStatus = {
  ...idlePredictionsWarmup,
  phase: 'done',
  ready: true,
  targetEvent: 34,
};

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
    expect(isStartupReady('pending', doneWarmup, donePredictionsWarmup)).toBe(false);
    expect(isStartupReady('running', doneWarmup, donePredictionsWarmup)).toBe(false);
  });

  it('is false while lineups or predictions warmup is in progress', () => {
    expect(isStartupReady('skipped', doneWarmup, donePredictionsWarmup)).toBe(true);
    expect(isStartupReady('done', doneWarmup, donePredictionsWarmup)).toBe(true);
    expect(isStartupReady('skipped', idleWarmup, donePredictionsWarmup)).toBe(false);
    expect(isStartupReady('skipped', doneWarmup, idlePredictionsWarmup)).toBe(false);
    expect(
      isStartupReady(
        'skipped',
        { ...idleWarmup, phase: 'hot', hotDone: 50, hotTotal: 360 },
        donePredictionsWarmup,
      ),
    ).toBe(false);
    expect(
      isStartupReady('skipped', doneWarmup, { ...idlePredictionsWarmup, phase: 'score' }),
    ).toBe(false);
  });

  it('is true when warmup failed so the app is not blocked forever', () => {
    expect(
      isStartupReady('skipped', { ...idleWarmup, phase: 'error', lastError: 'boom' }, donePredictionsWarmup),
    ).toBe(true);
    expect(
      isStartupReady('skipped', doneWarmup, { ...idlePredictionsWarmup, phase: 'error', lastError: 'boom' }),
    ).toBe(true);
  });
});
