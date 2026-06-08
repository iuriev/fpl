import type { PlayerPosition } from './types';

export interface OptimizerPlayer {
  id: number;
  position: PlayerPosition;
  teamId: number;
  nowCost: number;
  xPts: number;
}

export interface FreeHitResult {
  swaps: Array<{ outId: number; inId: number }>;
  totalXPts: number;
  targetGw: number;
  selectedCost: number;
}

const SLOT_COUNTS: Record<PlayerPosition, number> = {
  GK: 2,
  DEF: 5,
  MID: 5,
  FWD: 3,
};

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

function minCostByPosition(
  players: OptimizerPlayer[],
): Record<PlayerPosition, number> {
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
    const candidates = [
      gk[0],
      ...defs.slice(0, d),
      ...mids.slice(0, m),
      ...fwds.slice(0, f),
    ];
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
  currentSquadIds: number[],
  targetGw: number,
): FreeHitResult {
  const sorted = [...players].sort((a, b) => b.xPts - a.xPts);
  const mins = minCostByPosition(players);

  const remaining: Record<PlayerPosition, number> = { ...SLOT_COUNTS };
  const clubCounts = new Map<number, number>();
  const selected: OptimizerPlayer[] = [];
  const selectedIds = new Set<number>();
  let budgetLeft = totalBudget;

  // Phase 1: greedy pick by xPts, respecting budget reserve
  for (const player of sorted) {
    if (selected.length === 15) break;
    const pos = player.position;
    if (remaining[pos] === 0) continue;
    if ((clubCounts.get(player.teamId) ?? 0) >= 3) continue;

    const slotsAfter: Record<PlayerPosition, number> = { ...remaining };
    slotsAfter[pos] -= 1;
    const reserve = POSITIONS.reduce((sum, p) => sum + mins[p] * slotsAfter[p], 0);

    if (player.nowCost > budgetLeft - reserve) continue;

    selected.push(player);
    selectedIds.add(player.id);
    budgetLeft -= player.nowCost;
    remaining[pos] -= 1;
    clubCounts.set(player.teamId, (clubCounts.get(player.teamId) ?? 0) + 1);
  }

  // Phase 2: fallback — fill any remaining slots with cheapest valid players
  if (selected.length < 15) {
    for (const pos of POSITIONS) {
      if (remaining[pos] === 0) continue;
      const candidates = sorted
        .filter(
          (p) =>
            p.position === pos &&
            !selectedIds.has(p.id) &&
            (clubCounts.get(p.teamId) ?? 0) < 3 &&
            p.nowCost <= budgetLeft,
        )
        .sort((a, b) => a.nowCost - b.nowCost);

      for (const p of candidates) {
        if (remaining[pos] === 0) break;
        if (p.nowCost > budgetLeft) break;
        selected.push(p);
        selectedIds.add(p.id);
        budgetLeft -= p.nowCost;
        remaining[pos] -= 1;
        clubCounts.set(p.teamId, (clubCounts.get(p.teamId) ?? 0) + 1);
      }
    }
  }

  const { starters, bench: _bench } = pickBestFormation(selected);
  const totalXPts = starters.reduce((sum, p) => sum + p.xPts, 0);

  const currentSet = new Set(currentSquadIds);
  const outIds = currentSquadIds.filter((id) => !selectedIds.has(id));
  const inIds = selected.map((p) => p.id).filter((id) => !currentSet.has(id));

  const swaps = outIds
    .map((outId, i) => ({ outId, inId: inIds[i] }))
    .filter((s) => s.inId !== undefined) as Array<{ outId: number; inId: number }>;

  const selectedCost = totalBudget - budgetLeft;
  return { swaps, totalXPts, targetGw, selectedCost };
}
