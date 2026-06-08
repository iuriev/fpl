import { describe, expect, it } from 'vitest';

import { expectedSavesPts } from './saves';

function makeHistory(games: { minutes: number; saves: number }[]) {
  return games.map((g) => ({
    ...g,
    expectedGoals: 0,
    expectedAssists: 0,
    starts: 1,
    defensiveContribution: 0,
    bonus: 0,
    yellowCards: 0,
    cleanSheets: 0,
  }));
}

describe('expectedSavesPts', () => {
  it('returns prior-based value when no history (3/3 = 1.0 × minsProb)', () => {
    expect(expectedSavesPts([], 1.0)).toBeCloseTo(1.0, 3);
    expect(expectedSavesPts([], 0.5)).toBeCloseTo(0.5, 3);
  });

  it('uses rolling average saves', () => {
    const history = makeHistory(Array(8).fill({ minutes: 90, saves: 6 }));
    // avg = 6 saves → 6/3 = 2.0 pts × minsProb=1
    expect(expectedSavesPts(history, 1.0)).toBeCloseTo(2.0, 3);
  });

  it('scales with minsProb', () => {
    const history = makeHistory(Array(8).fill({ minutes: 90, saves: 3 }));
    const full = expectedSavesPts(history, 1.0);
    const half = expectedSavesPts(history, 0.5);
    expect(full).toBeCloseTo(half * 2, 5);
  });

  it('ignores games with 0 minutes when computing average', () => {
    const history = makeHistory([
      { minutes: 0, saves: 0 },
      { minutes: 0, saves: 0 },
      { minutes: 90, saves: 6 },
      { minutes: 90, saves: 6 },
    ]);
    // Only 2 played games, avg = 6
    expect(expectedSavesPts(history, 1.0)).toBeCloseTo(2.0, 3);
  });

  it('high-save GK earns more than low-save GK', () => {
    const highSave = makeHistory(Array(5).fill({ minutes: 90, saves: 9 }));
    const lowSave = makeHistory(Array(5).fill({ minutes: 90, saves: 1 }));
    expect(expectedSavesPts(highSave, 1.0)).toBeGreaterThan(
      expectedSavesPts(lowSave, 1.0),
    );
  });
});
