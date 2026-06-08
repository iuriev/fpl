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
 * 21-player pool with GKs from 8 different clubs to avoid club-limit deadlocks.
 * Costs are in FPL units (10 = £1.0m).
 */
function makePool(): OptimizerPlayer[] {
  return [
    // GKs — each from a unique club (clubs 11–18 to not conflict with outfield clubs 1–10)
    p(1, 'GK', 11, 55, 6.0),
    p(2, 'GK', 12, 50, 5.0),
    p(3, 'GK', 13, 45, 4.0),
    p(4, 'GK', 14, 40, 3.0),
    // DEFs
    p(10, 'DEF', 1, 70, 7.0),
    p(11, 'DEF', 2, 65, 6.5),
    p(12, 'DEF', 3, 60, 6.0),
    p(13, 'DEF', 4, 55, 5.5),
    p(14, 'DEF', 5, 50, 5.0),
    p(15, 'DEF', 6, 45, 4.5),
    p(16, 'DEF', 7, 40, 4.0),
    // MIDs
    p(20, 'MID', 1, 130, 10.0),
    p(21, 'MID', 2, 120, 9.5),
    p(22, 'MID', 3, 110, 9.0),
    p(23, 'MID', 4, 100, 8.5),
    p(24, 'MID', 5, 90, 8.0),
    p(25, 'MID', 6, 80, 7.5),
    p(26, 'MID', 7, 70, 7.0),
    // FWDs
    p(30, 'FWD', 1, 130, 9.0),
    p(31, 'FWD', 2, 110, 8.5),
    p(32, 'FWD', 3, 95, 8.0),
    p(33, 'FWD', 4, 80, 7.5),
    p(34, 'FWD', 5, 65, 7.0),
  ];
}

// 15 players that exist in the pool
const CURRENT_SQUAD = [1, 2, 10, 11, 12, 13, 14, 20, 21, 22, 23, 24, 30, 31, 32];

// Minimum cost of any valid 15-player squad from this pool
// GK: 40+45=85, DEF: 40+45+50+55+60=250, MID: 70+80+90+100+110=450, FWD: 65+80+95=240 → 1025
const MIN_SQUAD_COST = 1025;

describe('optimizeFreeHit', () => {
  it('fills all 15 squad slots', () => {
    const pool = makePool();
    const budget = 5000; // unconstrained
    const result = optimizeFreeHit(budget, pool, CURRENT_SQUAD, 38);

    const selected = new Set(CURRENT_SQUAD);
    for (const s of result.swaps) {
      selected.delete(s.outId);
      selected.add(s.inId);
    }
    expect(selected.size).toBe(15);
  });

  it('does not exceed total budget', () => {
    const pool = makePool();
    // Budget between min (1025) and current squad cost (~1290) — forces cheaper picks
    const budget = MIN_SQUAD_COST + 200;
    const result = optimizeFreeHit(budget, pool, CURRENT_SQUAD, 38);
    // selectedCost is the sum of nowCost of the players the optimizer actually chose
    expect(result.selectedCost).toBeLessThanOrEqual(budget);
  });

  it('respects max 3 players per club', () => {
    const pool = makePool();
    const budget = 5000;
    const result = optimizeFreeHit(budget, pool, CURRENT_SQUAD, 38);

    const selectedIds = new Set(CURRENT_SQUAD);
    for (const s of result.swaps) {
      selectedIds.delete(s.outId);
      selectedIds.add(s.inId);
    }

    const clubCounts = new Map<number, number>();
    for (const id of selectedIds) {
      const pl = pool.find((q) => q.id === id);
      if (pl) clubCounts.set(pl.teamId, (clubCounts.get(pl.teamId) ?? 0) + 1);
    }

    for (const [, count] of clubCounts) {
      expect(count).toBeLessThanOrEqual(3);
    }
  });

  it('returns no swaps when current squad is already the top 15 by xPts', () => {
    // Pool where ids 1–15 have the highest xPts and ARE the current squad.
    // Ids 20+ are worse alternatives.
    const pool: OptimizerPlayer[] = [
      p(1, 'GK', 11, 55, 9.0),
      p(2, 'GK', 12, 50, 8.0),
      p(10, 'DEF', 1, 70, 7.5),
      p(11, 'DEF', 2, 65, 7.0),
      p(12, 'DEF', 3, 60, 6.5),
      p(13, 'DEF', 4, 55, 6.0),
      p(14, 'DEF', 5, 50, 5.5),
      p(20, 'MID', 1, 130, 5.0),
      p(21, 'MID', 2, 120, 4.5),
      p(22, 'MID', 3, 110, 4.0),
      p(23, 'MID', 4, 100, 3.5),
      p(24, 'MID', 5, 90, 3.0),
      p(30, 'FWD', 1, 130, 8.5),
      p(31, 'FWD', 2, 110, 8.0),
      p(32, 'FWD', 3, 95, 7.5),
      // Cheaper alternatives with lower xPts — should not be picked
      p(50, 'GK', 15, 40, 1.0),
      p(51, 'DEF', 6, 40, 1.0),
      p(52, 'MID', 6, 70, 2.0),
      p(53, 'FWD', 4, 65, 1.0),
    ];

    const squadCost = CURRENT_SQUAD.reduce((sum, id) => {
      const pl = pool.find((q) => q.id === id);
      return sum + (pl?.nowCost ?? 0);
    }, 0);

    const result = optimizeFreeHit(squadCost + 50, pool, CURRENT_SQUAD, 38);
    expect(result.swaps).toHaveLength(0);
  });

  it('returns positive totalXPts and correct targetGw', () => {
    const pool = makePool();
    const result = optimizeFreeHit(5000, pool, CURRENT_SQUAD, 38);
    expect(result.totalXPts).toBeGreaterThan(0);
    expect(result.targetGw).toBe(38);
  });
});
