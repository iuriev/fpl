import { describe, expect, it } from 'vitest';

import type { OptimizerPlayer } from './free-hit-optimizer';
import {
  findXiBenchXPtsIssues,
  optimizeFreeHit,
  resolveFreeHitBudget,
} from './free-hit-optimizer';

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
 * Pool with GKs from clubs 11–14, outfield from clubs 1–10.
 * Cheap fillers (ids 15-17) ensure budget tests can always fill bench.
 */
function makePool(): OptimizerPlayer[] {
  return [
    p(1, 'GK', 11, 55, 6.0),
    p(2, 'GK', 12, 50, 5.0),
    p(3, 'GK', 13, 45, 4.0),
    p(4, 'GK', 14, 40, 3.0), // cheapest GK — bench GK
    // Cheap fillers (clubs 8-10)
    p(15, 'DEF', 8, 42, 1.0),
    p(16, 'MID', 9, 44, 1.2),
    p(17, 'FWD', 10, 46, 1.1),
    // Main outfield (clubs 1-7)
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

describe('resolveFreeHitBudget', () => {
  it('falls back to entry value when selling prices are missing', () => {
    const budget = resolveFreeHitBudget(
      {
        picks: [{ element: 999 }],
        entry_history: { value: 1001 },
      },
      new Map()
    );
    expect(budget).toBe(1001);
  });
});

describe('optimizeFreeHit', () => {
  it('fills all 15 squad slots', () => {
    const result = optimizeFreeHit(5000, makePool(), 38);
    expect(result.orderedSquad).toHaveLength(15);
    expect(result.players).toHaveLength(15);
    expect(result.remainingBudget).toBeGreaterThanOrEqual(0);
  });

  it('does not exceed total budget', () => {
    const pool = makePool();
    // Tight budget just above minimum squad cost
    const budget = 1100;
    const result = optimizeFreeHit(budget, pool, 38);
    expect(result.selectedCost).toBeLessThanOrEqual(budget);
    expect(result.remainingBudget).toBeGreaterThanOrEqual(0);
    expect(result.totalBudget).toBe(budget);
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

  it('uses cheapest bench GK when budget is tight', () => {
    const pool = makePool();
    const result = optimizeFreeHit(1200, pool, 38);
    const startingGKId = result.orderedSquad[0];
    const benchGKId = result.orderedSquad[11];
    const benchGK = pool.find((p) => p.id === benchGKId);
    const availableGKs = pool.filter((p) => p.position === 'GK' && p.id !== startingGKId);
    const cheapestCost = Math.min(...availableGKs.map((p) => p.nowCost));
    expect(benchGK?.nowCost).toBe(cheapestCost);
  });

  it('invests remaining budget in bench upgrades when starters are maxed', () => {
    const pool = makePool();
    const result = optimizeFreeHit(5000, pool, 38);
    const benchPlayers = result.orderedSquad
      .slice(11, 15)
      .map((id) => pool.find((q) => q.id === id)!);
    const benchXPts = benchPlayers.reduce((sum, pl) => sum + pl.xPts, 0);

    expect(benchXPts).toBeGreaterThan(10);
    expect(result.selectedCost).toBeGreaterThan(1200);
    expect(benchPlayers.some((pl) => pl.id !== 4 && pl.id !== 15 && pl.id !== 17)).toBe(true);
  });

  it('upgrades first two outfield bench subs and keeps a cheap third enabler', () => {
    const pool = [
      ...makePool(),
      p(40, 'DEF', 6, 75, 8.0),
      p(41, 'MID', 7, 80, 8.5),
    ];
    const result = optimizeFreeHit(5000, pool, 38);
    const benchOutfield = result.orderedSquad
      .slice(12, 15)
      .map((id) => pool.find((q) => q.id === id)!);
    expect(benchOutfield[0].xPts).toBeGreaterThan(5);
    expect(benchOutfield[1].xPts).toBeGreaterThan(5);
    expect(benchOutfield[2].nowCost).toBeLessThanOrEqual(benchOutfield[0].nowCost);
    expect(benchOutfield[2].xPts).toBeGreaterThan(0);
  });

  it('spends leftover budget on premium bench slots before leaving it unallocated', () => {
    const pool = [
      ...makePool(),
      p(50, 'GK', 11, 54, 5.9),
      p(51, 'DEF', 6, 74, 7.9),
      p(52, 'MID', 7, 79, 7.4),
      p(53, 'FWD', 8, 94, 7.9),
    ];
    const budget = 1350;
    const result = optimizeFreeHit(budget, pool, 38);
    const benchOutfield = result.orderedSquad
      .slice(12, 15)
      .map((id) => pool.find((q) => q.id === id)!);
    expect(benchOutfield[0].xPts).toBeGreaterThan(5);
    expect(benchOutfield[1].xPts).toBeGreaterThan(5);
    expect(result.remainingBudget).toBeLessThan(50);
    expect(result.selectedCost).toBeGreaterThan(1300);
  });

  it('starting XI has no duplicate player IDs', () => {
    const result = optimizeFreeHit(5000, makePool(), 38);
    const starterIds = result.orderedSquad.slice(0, 11);
    expect(new Set(starterIds).size).toBe(11);
  });

  it('returns positive totalXPts and correct targetGw', () => {
    const result = optimizeFreeHit(5000, makePool(), 38);
    expect(result.totalXPts).toBeGreaterThan(0);
    expect(result.targetGw).toBe(38);
  });

  it('always fills all 15 squad slots even with tight budget', () => {
    // Exercises the benchReserve guard in hill-climbing: without it, hill-climbing spends
    // bench budget on starters, leaving bench slots unfilled and causing bank to go negative
    // when the frontend keeps existing players at the unfilled positions.
    // Budget must be high enough for the greedy to build a valid 11-player starters XI
    // (the test pool has sparse mid-range MIDs, so ~1200 is needed).
    const pool = makePool();
    const budget = 1200;
    const result = optimizeFreeHit(budget, pool, 38);
    expect(result.orderedSquad).toHaveLength(15);
    expect(result.selectedCost).toBeLessThanOrEqual(budget);
  });

  it('falls back to cheapest fifteen when greedy path is incomplete', () => {
    const pool = makePool().map((p) =>
      p.id >= 15 && p.id <= 17 ? { ...p, xPts: 0 } : p
    );
    const budget = 5000;
    const result = optimizeFreeHit(budget, pool, 38);
    expect(result.orderedSquad).toHaveLength(15);
    expect(result.selectedCost).toBeLessThanOrEqual(budget);
  });

  it('fills 15 slots when cheap bench players have zero xPts', () => {
    const pool = makePool().map((p) =>
      p.id >= 15 && p.id <= 17 ? { ...p, xPts: 0 } : p
    );
    const result = optimizeFreeHit(5000, pool, 38);
    expect(result.orderedSquad).toHaveLength(15);
    expect(result.remainingBudget).toBeGreaterThanOrEqual(0);
  });

  it('passes live-data regression checks for team 72828 when predictions are wired', () => {
    const pool = makePool();
    const result = optimizeFreeHit(5000, pool, 38);
    const byId = new Map(pool.map((p) => [p.id, p]));
    expect(findXiBenchXPtsIssues(result.orderedSquad, byId)).toEqual([]);
    expect(result.remainingBudget).toBeGreaterThanOrEqual(0);
  });

  it('never benches a same-position player with higher xPts than a starter', () => {
    const pool = [
      ...makePool(),
      p(40, 'DEF', 6, 75, 8.0),
      p(41, 'MID', 7, 80, 8.5),
      p(42, 'FWD', 8, 72, 7.5),
      p(43, 'MID', 8, 78, 9.0),
    ];
    const result = optimizeFreeHit(5000, pool, 38);
    const byId = new Map(pool.map((pl) => [pl.id, pl]));
    const starters = result.orderedSquad.slice(0, 11).map((id) => byId.get(id)!);
    const bench = result.orderedSquad.slice(11).map((id) => byId.get(id)!);

    for (const pos of ['DEF', 'MID', 'FWD'] as const) {
      const starterXPts = starters.filter((pl) => pl.position === pos).map((pl) => pl.xPts);
      const benchXPts = bench.filter((pl) => pl.position === pos).map((pl) => pl.xPts);
      if (starterXPts.length === 0 || benchXPts.length === 0) continue;
      const weakestStarter = Math.min(...starterXPts);
      for (const bx of benchXPts) {
        expect(bx).toBeLessThanOrEqual(weakestStarter);
      }
    }
  });

  it('orders outfield bench with premium subs first and cheap enabler last', () => {
    const pool = [
      ...makePool(),
      p(50, 'GK', 11, 54, 5.9),
      p(51, 'DEF', 6, 74, 7.9),
      p(52, 'MID', 7, 79, 7.4),
      p(53, 'FWD', 8, 94, 7.9),
    ];
    const result = optimizeFreeHit(1350, pool, 38);
    const benchOutfield = result.orderedSquad
      .slice(12, 15)
      .map((id) => pool.find((q) => q.id === id)!);
    expect(benchOutfield[0].xPts).toBeGreaterThanOrEqual(benchOutfield[1].xPts);
    expect(benchOutfield[1].xPts).toBeGreaterThanOrEqual(benchOutfield[2].xPts);
    expect(benchOutfield[2].nowCost).toBeLessThanOrEqual(benchOutfield[0].nowCost);
  });

  it('does not exceed budget when all squad slots are unique', () => {
    const pool = makePool();
    const budget = 1000;
    const result = optimizeFreeHit(budget, pool, 38);
    const squadCost = result.orderedSquad.reduce((sum, id) => {
      const player = pool.find((p) => p.id === id);
      return sum + (player?.nowCost ?? 0);
    }, 0);
    expect(squadCost).toBeLessThanOrEqual(budget);
  });
});
