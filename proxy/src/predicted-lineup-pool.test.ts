import { describe, expect, it } from 'vitest';

import type { FPLBootstrapStatic } from './fpl-client';
import { predictedLineupPoolElements } from './predicted-lineup-pool';

const bootstrap = {
  elements: [
    { id: 1, team: 1, minutes: 0, total_points: 0 },
    { id: 2, team: 1, minutes: 45, total_points: 2 },
    { id: 3, team: 1, minutes: 0, total_points: 5 },
    { id: 4, team: 2, minutes: 0, total_points: 0 },
  ],
} as unknown as FPLBootstrapStatic;

describe('predictedLineupPoolElements', () => {
  it('includes anyone on gw1 even with zero minutes', () => {
    const pool = predictedLineupPoolElements(bootstrap, 1, 1);
    expect(pool.map((e) => e.id).sort()).toEqual([1, 2, 3]);
  });

  it('after gw1 requires at least one season minute', () => {
    const pool = predictedLineupPoolElements(bootstrap, 1, 2);
    expect(pool.map((e) => e.id)).toEqual([2]);
  });
});
