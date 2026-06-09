import { describe, expect, it } from 'vitest';

import type { OptimizerPlayer } from './free-hit-optimizer';
import { optimizeFreeHit } from './free-hit-optimizer';

function p(
  id: number,
  position: OptimizerPlayer['position'],
  teamId: number,
  nowCost: number,
  xPts: number,
): OptimizerPlayer {
  return { id, position, teamId, nowCost, xPts };
}

/**
 * Pool: GKs from clubs 11–14, outfield from clubs 1–10.
 * Includes cheap GK (id=4, cost=40) and cheap outfield fillers (id=15-17).
 */
function makePool(): OptimizerPlayer[] {
  return [
    // GKs — clubs 11–14 to avoid conflicts with outfield clubs
    p(1, 'GK', 11, 55, 6.0),
    p(2, 'GK', 12, 50, 5.0),
    p(3, 'GK', 13, 45, 4.0),
    p(4, 'GK', 14, 40, 3.0), // cheapest GK — should always be bench GK
    // Cheap outfield fillers — clubs 8, 9, 10
    p(15, 'DEF', 8, 42, 1.0),
    p(16, 'MID', 9, 44, 1.2),
    p(17, 'FWD', 10, 46, 1.1),
    // Main outfield pool — clubs 1–7
    p(10, 'DEF', 1, 70, 7.0),
    p(11, 'DEF', 2, 65, 6.5),
    p(12, 'DEF', 3, 60, 6.0),
    p(13, 'DEF', 4, 55, 5.5),
    p(14, 'DEF', 5, 50, 5.0),
    p(20, 'MID', 1, 130, 10.0),
    p(21, 'MID', 2, 120, 9.5),
    p(22, 'MID', 3, 110, 9.0),
    p(23, 'MID', 4, 100, 8.5),
    p(24, 'MID', 5, 90, 8.0),
    p(25, 'MID', 6, 80, 7.5),
    p(26, 'MID', 7, 70, 7.0),
    p(30, 'FWD', 1, 130, 9.0),
    p(31, 'FWD', 2, 110, 8.5),
    p(32, 'FWD', 3, 95, 8.0),
    p(33, 'FWD', 4, 80, 7.5),
    p(34, 'FWD', 5, 65, 7.0),
  ];
}

describe('optimizeFreeHit', () => {
  it('fills all 15 squad slots', () => {
    const pool = makePool();
    const result = optimizeFreeHit(5000, pool, 38);
    expect(result.orderedSquad).toHaveLength(15);
  });

  it('does not exceed total budget', () => {
    const pool = makePool();
    // Tight budget: just above minimum squad cost
    // Min: GK(40+45)=85, DEF(42+50+55+60+65)=272, MID(44+70+80+90+100)=384, FWD(46+65+80)=191 = 932
    const budget = 1100;
    const result = optimizeFreeHit(budget, pool, 38);
    expect(result.selectedCost).toBeLessThanOrEqual(budget);
  });

  it('respects max 3 players per club', () => {
    const pool = makePool();
    const result = optimizeFreeHit(5000, pool, 38);
    const clubCounts = new Map<number, number>();
    for (const id of result.orderedSquad) {
      const pl = pool.find((q) => q.id === id);
      if (pl) clubCounts.set(pl.teamId, (clubCounts.get(pl.teamId) ?? 0) + 1);
    }
    for (const [, count] of clubCounts) {
      expect(count).toBeLessThanOrEqual(3);
    }
  });

  it('bench GK is the cheapest available goalkeeper', () => {
    const pool = makePool();
    const result = optimizeFreeHit(5000, pool, 38);
    // orderedSquad[0] = starting GK, orderedSquad[11] = bench GK
    const startingGKId = result.orderedSquad[0];
    const benchGKId = result.orderedSquad[11];
    const benchGK = pool.find((p) => p.id === benchGKId);
    const allGKs = pool.filter((p) => p.position === 'GK' && p.id !== startingGKId);
    const cheapestGKCost = Math.min(...allGKs.map((p) => p.nowCost));
    expect(benchGK?.nowCost).toBe(cheapestGKCost);
  });

  it('returns positive totalXPts and correct targetGw', () => {
    const pool = makePool();
    const result = optimizeFreeHit(5000, pool, 38);
    expect(result.totalXPts).toBeGreaterThan(0);
    expect(result.targetGw).toBe(38);
  });
});
