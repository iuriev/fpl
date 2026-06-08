import { describe, expect, it } from 'vitest';

import { contextBonusPts, expectedBonusPts } from './bonus';

function makeHistory(games: { minutes: number; bonus: number }[]) {
  return games.map((g) => ({
    ...g,
    expectedGoals: 0,
    expectedAssists: 0,
    starts: 1,
    defensiveContribution: 0,
    yellowCards: 0,
    saves: 0,
    cleanSheets: 0,
  }));
}

describe('contextBonusPts', () => {
  it('returns near-zero when no goal involvements expected', () => {
    expect(contextBonusPts(0, 0)).toBeCloseTo(0.042, 2);
  });

  it('returns ~0.86 for expected 1 goal involvement', () => {
    // At lambda=1, P(gi=1) is highest so result approaches 0.86
    const result = contextBonusPts(1, 0);
    expect(result).toBeGreaterThan(0.4);
    expect(result).toBeLessThan(1.2);
  });

  it('increases monotonically with more expected goal involvements', () => {
    const low = contextBonusPts(0.1, 0.1);
    const mid = contextBonusPts(0.4, 0.4);
    const high = contextBonusPts(0.8, 0.8);
    expect(mid).toBeGreaterThan(low);
    expect(high).toBeGreaterThan(mid);
  });
});

describe('expectedBonusPts', () => {
  it('uses rolling average for GK, not context formula', () => {
    const history = makeHistory([
      { minutes: 90, bonus: 2 },
      { minutes: 90, bonus: 1 },
      { minutes: 90, bonus: 0 },
      { minutes: 90, bonus: 3 },
      { minutes: 90, bonus: 0 },
    ]);
    const result = expectedBonusPts('GK', history, 0, 0, 1.0);
    // Rolling avg = 1.2, weight = 5/8 = 0.625, blended = 0.625×1.2 + 0.375×0.16 ≈ 0.81
    expect(result).toBeCloseTo(0.81, 1);
    // Must be higher than the GK prior (0.16) since rolling avg > prior
    expect(result).toBeGreaterThan(0.16);
  });

  it('returns position prior when no history', () => {
    // FWD prior = 0.39, minsProb=1, contextBonusPts(0,0)≈0.042
    // blend: 0.5×0.042 + 0.5×0.39 = 0.216
    const result = expectedBonusPts('FWD', [], 0, 0, 1.0);
    expect(result).toBeGreaterThan(0.1);
    expect(result).toBeLessThan(0.4);
  });

  it('scales linearly with minsProb', () => {
    const history = makeHistory([
      { minutes: 90, bonus: 1 },
      { minutes: 90, bonus: 1 },
    ]);
    const full = expectedBonusPts('MID', history, 0.1, 0.1, 1.0);
    const half = expectedBonusPts('MID', history, 0.1, 0.1, 0.5);
    expect(full).toBeCloseTo(half * 2, 3);
  });

  it('high-performing FWD with history earns more than position prior', () => {
    const history = makeHistory(
      Array(10).fill({ minutes: 90, bonus: 2 }),
    );
    const result = expectedBonusPts('FWD', history, 0.3, 0.2, 1.0);
    // Rolling avg = 2.0, blended ≈ 2.0 (full weight), context ~0.3
    // expected = (0.5 × ctx + 0.5 × 2.0) × 1
    expect(result).toBeGreaterThan(0.9);
  });
});
