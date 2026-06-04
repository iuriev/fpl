import { describe, expect, it } from 'vitest';

import type { FPLBootstrapStatic } from './fpl-client';
import { computePredictedStartScore } from './predicted-lineup-start-score';

const baseEl = {
  chance_of_playing_next_round: 100,
  chance_of_playing_this_round: null,
  status: 'a',
} as FPLBootstrapStatic['elements'][number];

describe('computePredictedStartScore', () => {
  it('uses bootstrap minutes when element-summary is missing', () => {
    const el = { ...baseEl, minutes: 270 } as FPLBootstrapStatic['elements'][number];
    const withSummary = computePredictedStartScore(el, {
      history: [{ minutes: 90, starts: 1 } as never],
    } as never);
    const withoutSummary = computePredictedStartScore(el, undefined);
    expect(withoutSummary).toBeGreaterThan(0.2);
    expect(withoutSummary).toBeLessThanOrEqual(withSummary + 0.15);
  });

  it('returns near zero when there is no history and no season minutes', () => {
    const el = { ...baseEl, minutes: 0 } as FPLBootstrapStatic['elements'][number];
    expect(computePredictedStartScore(el, undefined)).toBeLessThan(0.35);
  });
});
