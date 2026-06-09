import type { PlayerPosition } from './types';

export interface OptimizerPlayer {
  id: number;
  position: PlayerPosition;
  teamId: number;
  nowCost: number;
  xPts: number;
}

export interface FreeHitResult {
  orderedSquad: number[];
  totalXPts: number;
  targetGw: number;
  selectedCost: number;
}

const POSITIONS: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];

// All valid outfield formations: [DEF, MID, FWD] summing to 10
const VALID_OUTFIELD_FORMATIONS: Array<[number, number, number]> = [
  [3, 5, 2],
  [3, 4, 3],
  [4, 5, 1],
  [4, 4, 2],
  [4, 3, 3],
  [5, 4, 1],
  [5, 3, 2],
  [5, 2, 3],
];

function minCostByPosition(players: OptimizerPlayer[]): Record<PlayerPosition, number> {
  const mins: Record<PlayerPosition, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const pos of POSITIONS) {
    const costs = players.filter((p) => p.position === pos).map((p) => p.nowCost);
    mins[pos] = costs.length > 0 ? Math.min(...costs) : 0;
  }
  return mins;
}

function pickBestFormation(
  squad: OptimizerPlayer[],
): { starters: OptimizerPlayer[]; bench: OptimizerPlayer[] } {
  const gk = squad.filter((p) => p.position === 'GK').sort((a, b) => b.xPts - a.xPts);
  const defs = squad.filter((p) => p.position === 'DEF').sort((a, b) => b.xPts - a.xPts);
  const mids = squad.filter((p) => p.position === 'MID').sort((a, b) => b.xPts - a.xPts);
  const fwds = squad.filter((p) => p.position === 'FWD').sort((a, b) => b.xPts - a.xPts);

  let bestXPts = -1;
  let bestStarters: OptimizerPlayer[] = [];

  for (const [d, m, f] of VALID_OUTFIELD_FORMATIONS) {
    if (d > defs.length || m > mids.length || f > fwds.length || gk.length === 0) continue;
    const candidates = [gk[0], ...defs.slice(0, d), ...mids.slice(0, m), ...fwds.slice(0, f)];
    const total = candidates.reduce((sum, p) => sum + p.xPts, 0);
    if (total > bestXPts) {
      bestXPts = total;
      bestStarters = candidates;
    }
  }

  const starterIds = new Set(bestStarters.map((p) => p.id));
  const bench = squad.filter((p) => !starterIds.has(p.id));
  return { starters: bestStarters, bench };
}

export function optimizeFreeHit(
  totalBudget: number,
  players: OptimizerPlayer[],
  targetGw: number,
): FreeHitResult {
  const sortedByXPts = [...players].sort((a, b) => b.xPts - a.xPts);
  const sortedByCost = [...players].sort((a, b) => a.nowCost - b.nowCost);
  const gkByCost = sortedByCost.filter((p) => p.position === 'GK');
  const gkByXPts = [...players].filter((p) => p.position === 'GK').sort((a, b) => b.xPts - a.xPts);
  const outfieldByCost = sortedByCost.filter((p) => p.position !== 'GK');

  // Minimum cost to fill 10 outfield starter slots (cheapest 10 outfield players)
  const min10OutfieldCost = outfieldByCost.slice(0, 10).reduce((s, p) => s + p.nowCost, 0);

  // Reserve enough budget for 4 bench slots: cheapest GK + 3 cheapest outfield
  const minBenchCost =
    (gkByCost[0]?.nowCost ?? 0) +
    (outfieldByCost[0]?.nowCost ?? 0) +
    (outfieldByCost[1]?.nowCost ?? 0) +
    (outfieldByCost[2]?.nowCost ?? 0);

  const mins = minCostByPosition(players);

  // Slot caps for the 11-player starting XI
  const remaining: Record<PlayerPosition, number> = { GK: 1, DEF: 5, MID: 5, FWD: 3 };
  const starters: OptimizerPlayer[] = [];
  const selectedIds = new Set<number>();
  const clubCounts = new Map<number, number>();
  let budgetLeft = totalBudget;

  // Phase 0: Pre-select the starting GK — best xPts GK that leaves enough for 10 outfield + bench.
  // Picking GK first avoids the budget being drained by outfield players, forcing a bad GK.
  const gkBudget = totalBudget - minBenchCost - min10OutfieldCost;
  const startingGK = gkByXPts.find(
    (p) => p.nowCost <= gkBudget && (clubCounts.get(p.teamId) ?? 0) < 3,
  );
  if (startingGK) {
    starters.push(startingGK);
    selectedIds.add(startingGK.id);
    budgetLeft -= startingGK.nowCost;
    remaining['GK'] = 0;
    clubCounts.set(startingGK.teamId, (clubCounts.get(startingGK.teamId) ?? 0) + 1);
  }

  // Phase 1: Greedy outfield starters — maximise xPts, leaving bench budget untouched
  for (const player of sortedByXPts) {
    if (starters.length === 11) break;
    const pos = player.position;
    if (pos === 'GK') continue; // already filled
    if (remaining[pos] === 0) continue;
    if ((clubCounts.get(player.teamId) ?? 0) >= 3) continue;

    const slotsAfter = { ...remaining, [pos]: remaining[pos] - 1 };
    const starterReserve = POSITIONS.reduce((s, p) => s + mins[p] * slotsAfter[p], 0);
    if (player.nowCost > budgetLeft - starterReserve - minBenchCost) continue;

    starters.push(player);
    selectedIds.add(player.id);
    budgetLeft -= player.nowCost;
    remaining[pos] -= 1;
    clubCounts.set(player.teamId, (clubCounts.get(player.teamId) ?? 0) + 1);
  }

  // Phase 1b: Fallback — fill any remaining starter slots with cheapest valid
  for (const pos of POSITIONS) {
    if (pos === 'GK' && remaining['GK'] === 0) continue;
    const candidates = sortedByCost.filter(
      (p) => p.position === pos && !selectedIds.has(p.id) && (clubCounts.get(p.teamId) ?? 0) < 3,
    );
    for (const p of candidates) {
      if (remaining[pos] === 0) break;
      if (p.nowCost > budgetLeft - minBenchCost) break;
      starters.push(p);
      selectedIds.add(p.id);
      budgetLeft -= p.nowCost;
      remaining[pos] -= 1;
      clubCounts.set(p.teamId, (clubCounts.get(p.teamId) ?? 0) + 1);
    }
  }

  // Phase 2a: Bench GK — cheapest eligible goalkeeper
  const benchGK = gkByCost.find(
    (p) => !selectedIds.has(p.id) && (clubCounts.get(p.teamId) ?? 0) < 3 && p.nowCost <= budgetLeft,
  );
  if (benchGK) {
    selectedIds.add(benchGK.id);
    budgetLeft -= benchGK.nowCost;
    clubCounts.set(benchGK.teamId, (clubCounts.get(benchGK.teamId) ?? 0) + 1);
  }

  // Phase 2b: Priority sub (bench slot 1) — highest-xPts outfield within remaining budget
  // Reserve enough for 2 cheap fillers before committing budget to the priority sub
  const remainingOutfieldByCost = outfieldByCost.filter(
    (p) => !selectedIds.has(p.id) && (clubCounts.get(p.teamId) ?? 0) < 3,
  );
  const minFiller1 = remainingOutfieldByCost[0]?.nowCost ?? 0;
  const minFiller2 = remainingOutfieldByCost[1]?.nowCost ?? 0;

  const prioritySub = [...players]
    .filter(
      (p) =>
        p.position !== 'GK' &&
        !selectedIds.has(p.id) &&
        (clubCounts.get(p.teamId) ?? 0) < 3 &&
        p.nowCost <= budgetLeft - minFiller1 - minFiller2,
    )
    .sort((a, b) => b.xPts - a.xPts)[0];

  if (prioritySub) {
    selectedIds.add(prioritySub.id);
    budgetLeft -= prioritySub.nowCost;
    clubCounts.set(prioritySub.teamId, (clubCounts.get(prioritySub.teamId) ?? 0) + 1);
  }

  // Phase 2c: 2 fillers — cheapest eligible outfield players
  const fillers: OptimizerPlayer[] = [];
  for (const p of outfieldByCost) {
    if (fillers.length === 2) break;
    if (selectedIds.has(p.id) || (clubCounts.get(p.teamId) ?? 0) >= 3) continue;
    if (p.nowCost > budgetLeft) break;
    fillers.push(p);
    selectedIds.add(p.id);
    budgetLeft -= p.nowCost;
    clubCounts.set(p.teamId, (clubCounts.get(p.teamId) ?? 0) + 1);
  }

  // Build ordered squad: starters (GK, DEF..., MID..., FWD...) | benchGK | prioritySub | filler1 | filler2
  const { starters: orderedStarters } = pickBestFormation(starters);
  const totalXPts = orderedStarters.reduce((sum, p) => sum + p.xPts, 0);

  const orderedSquad = [
    ...orderedStarters.map((p) => p.id),
    ...(benchGK ? [benchGK.id] : []),
    ...(prioritySub ? [prioritySub.id] : []),
    ...fillers.map((p) => p.id),
  ];

  const selectedCost = totalBudget - budgetLeft;
  return { orderedSquad, totalXPts, targetGw, selectedCost };
}
