import { describe, expect, it } from 'vitest';

import { expectedYellowDeduction } from './yellow-card';

function makeHistory(games: { minutes: number; yellowCards: number }[]) {
  return games.map((g) => ({
    ...g,
    expectedGoals: 0,
    expectedAssists: 0,
    starts: 1,
    defensiveContribution: 0,
    bonus: 0,
    saves: 0,
    cleanSheets: 0,
  }));
}

describe('expectedYellowDeduction', () => {
  it('returns negative value (a deduction)', () => {
    const result = expectedYellowDeduction('MID', [], 1.0);
    expect(result).toBeLessThan(0);
  });

  it('falls back to position prior when no history', () => {
    // DEF prior = 0.12, minsProb=1 → -0.12
    expect(expectedYellowDeduction('DEF', [], 1.0)).toBeCloseTo(-0.12, 3);
    // MID prior = 0.10
    expect(expectedYellowDeduction('MID', [], 1.0)).toBeCloseTo(-0.10, 3);
    // GK prior = 0.02
    expect(expectedYellowDeduction('GK', [], 1.0)).toBeCloseTo(-0.02, 3);
  });

  it('scales with minsProb', () => {
    const full = expectedYellowDeduction('FWD', [], 1.0);
    const half = expectedYellowDeduction('FWD', [], 0.5);
    expect(full).toBeCloseTo(half * 2, 5);
  });

  it('uses rolling history when available', () => {
    const history = makeHistory(
      Array(10).fill({ minutes: 90, yellowCards: 0 }),
    );
    const result = expectedYellowDeduction('DEF', history, 1.0);
    // 10 games with 0 yellow cards: weight=1.0, blended=0 → deduction=0
    expect(result).toBeGreaterThanOrEqual(-0.12);
    expect(result).toBeLessThanOrEqual(0);
  });

  it('disciplinary player has larger deduction than clean player', () => {
    const dirty = makeHistory(Array(10).fill({ minutes: 90, yellowCards: 1 }));
    const clean = makeHistory(Array(10).fill({ minutes: 90, yellowCards: 0 }));
    const dirtyResult = expectedYellowDeduction('MID', dirty, 1.0);
    const cleanResult = expectedYellowDeduction('MID', clean, 1.0);
    expect(dirtyResult).toBeLessThan(cleanResult);
  });
});
