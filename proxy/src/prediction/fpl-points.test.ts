import { describe, expect, it } from 'vitest';

import { modelXPts } from './fpl-points';

const BASE = {
  xGoals: 0,
  xAssists: 0,
  csProb: null,
  lambdaAgainst: 1.0,
  minsProb: 1.0,
  prob60Plus: 1.0,
  defconPts: 0,
  bonusPts: 0,
  savesPts: 0,
  yellowDeduction: 0,
} as const;

describe('modelXPts', () => {
  it('starter who plays 90 min with no contributions earns 2 appearance pts', () => {
    expect(
      modelXPts('MID', 0, 0, null, 1, 1.0, 1.0, 0, 0, 0, 0),
    ).toBeCloseTo(2.0, 3);
  });

  it('sub who never plays 60+ earns 1 appearance pt', () => {
    expect(
      modelXPts('MID', 0, 0, null, 1, 0.5, 0.0, 0, 0, 0, 0),
    ).toBeCloseTo(1.0, 3);
  });

  it('prob60Plus drives appearance, not minsProb', () => {
    // Player avg 70 min (minsProb≈0.78) but always starts (prob60Plus=1.0)
    const pts = modelXPts('FWD', 0, 0, null, 1, 0.78, 1.0, 0, 0, 0, 0);
    expect(pts).toBeCloseTo(2.0, 3);
  });

  it('FWD goal worth 4 pts', () => {
    const pts = modelXPts('FWD', 1, 0, null, 0, 1.0, 1.0, 0, 0, 0, 0);
    expect(pts).toBeCloseTo(2 + 4, 3);
  });

  it('MID goal worth 5 pts', () => {
    const pts = modelXPts('MID', 1, 0, null, 0, 1.0, 1.0, 0, 0, 0, 0);
    expect(pts).toBeCloseTo(2 + 5, 3);
  });

  it('assist worth 3 pts for all positions', () => {
    for (const pos of ['FWD', 'MID', 'DEF', 'GK'] as const) {
      const pts = modelXPts(pos, 0, 1, null, 0, 1.0, 1.0, 0, 0, 0, 0);
      expect(pts).toBeCloseTo(2 + 3, 3);
    }
  });

  it('DEF/GK earn clean sheet pts; FWD earns 0', () => {
    const def = modelXPts('DEF', 0, 0, 0.5, 0, 1.0, 1.0, 0, 0, 0, 0);
    const fwd = modelXPts('FWD', 0, 0, 0.5, 0, 1.0, 1.0, 0, 0, 0, 0);
    expect(def).toBeGreaterThan(fwd);
    expect(fwd).toBeCloseTo(2.0, 3);
  });

  it('MID earns 1 CS pt when csProb is provided', () => {
    const withCs = modelXPts('MID', 0, 0, 1.0, 0, 1.0, 1.0, 0, 0, 0, 0);
    const noCs = modelXPts('MID', 0, 0, null, 0, 1.0, 1.0, 0, 0, 0, 0);
    expect(withCs - noCs).toBeCloseTo(1.0, 3);
  });

  it('bonus and saves pts add positively', () => {
    const base = modelXPts('FWD', 0, 0, null, 0, 1.0, 1.0, 0, 0, 0, 0);
    const withBonus = modelXPts('FWD', 0, 0, null, 0, 1.0, 1.0, 0, 1.5, 0, 0);
    expect(withBonus - base).toBeCloseTo(1.5, 3);
  });

  it('yellow deduction reduces score', () => {
    const base = modelXPts('MID', 0, 0, null, 0, 1.0, 1.0, 0, 0, 0, 0);
    const withYellow = modelXPts('MID', 0, 0, null, 0, 1.0, 1.0, 0, 0, 0, -0.1);
    expect(withYellow).toBeCloseTo(base - 0.1, 3);
  });
});
