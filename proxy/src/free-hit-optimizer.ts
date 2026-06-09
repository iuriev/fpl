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

function pickBestFormation(squad: OptimizerPlayer[]): { starters: OptimizerPlayer[] } {
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
  return { starters: bestStarters };
}

export function optimizeFreeHit(
  totalBudget: number,
  players: OptimizerPlayer[],
  targetGw: number,
): FreeHitResult {
  const byXPts = [...players].sort((a, b) => b.xPts - a.xPts);
  const byCost = [...players].sort((a, b) => a.nowCost - b.nowCost);
  const gkByCost = byCost.filter((p) => p.position === 'GK');
  const outfieldByCost = byCost.filter((p) => p.position !== 'GK');

  // ── Step 1: Reserve minimum bench budget ───────────────────────────────────
  // Bench = 1 cheapest GK + 3 cheapest outfield (positions TBD after starters)
  const benchReserve =
    (gkByCost[0]?.nowCost ?? 0) +
    (outfieldByCost[0]?.nowCost ?? 0) +
    (outfieldByCost[1]?.nowCost ?? 0) +
    (outfieldByCost[2]?.nowCost ?? 0);

  const minN = (pos: PlayerPosition, n: number): number =>
    byCost.filter((p) => p.position === pos).slice(0, n).reduce((s, p) => s + p.nowCost, 0);
  const minOutN = (n: number): number =>
    outfieldByCost.slice(0, n).reduce((s, p) => s + p.nowCost, 0);

  let budget = totalBudget;
  const selected = new Set<number>();
  const starters: OptimizerPlayer[] = [];
  const clubCounts = new Map<number, number>();

  // ── Step 2: Build starting XI spine ───────────────────────────────────────
  // Order: FWD(2) → MID(3) → DEF(3) → GK(1) → flex(2, best remaining outfield)
  // Each step reserves minimums for all subsequent steps + bench.
  const pickN = (pos: PlayerPosition, n: number, subsequentReserve: number): void => {
    let cnt = 0;
    for (const p of byXPts) {
      if (cnt === n) break;
      if (p.position !== pos || selected.has(p.id)) continue;
      if ((clubCounts.get(p.teamId) ?? 0) >= 3) continue;
      if (p.nowCost > budget - subsequentReserve - benchReserve) continue;
      starters.push(p);
      selected.add(p.id);
      budget -= p.nowCost;
      clubCounts.set(p.teamId, (clubCounts.get(p.teamId) ?? 0) + 1);
      cnt++;
    }
  };

  pickN('FWD', 2, minN('MID', 3) + minN('DEF', 3) + minN('GK', 1) + minOutN(2));
  pickN('MID', 3, minN('DEF', 3) + minN('GK', 1) + minOutN(2));
  pickN('DEF', 3, minN('GK', 1) + minOutN(2));
  pickN('GK', 1, minOutN(2));

  // Flex: 2 best remaining outfield, respecting squad slot limits (DEF≤2, MID≤2, FWD≤1)
  const flexSlots = { DEF: 2, MID: 2, FWD: 1 };
  let flexCnt = 0;
  for (const p of byXPts) {
    if (flexCnt === 2) break;
    if (p.position === 'GK' || selected.has(p.id)) continue;
    if ((clubCounts.get(p.teamId) ?? 0) >= 3) continue;
    if ((flexSlots[p.position] ?? 0) === 0) continue;
    if (p.nowCost > budget - benchReserve) continue;
    starters.push(p);
    selected.add(p.id);
    budget -= p.nowCost;
    clubCounts.set(p.teamId, (clubCounts.get(p.teamId) ?? 0) + 1);
    flexSlots[p.position]--;
    flexCnt++;
  }

  // ── Step 3: 3-round hill-climbing normalization ────────────────────────────
  // Each round: for every starter try to find a strictly better same-position
  // player that fits in the available budget. Converges to a local optimum.
  for (let round = 0; round < 3; round++) {
    for (let i = 0; i < starters.length; i++) {
      const cur = starters[i];
      const avail = budget + cur.nowCost; // budget if cur is removed
      const upgrade = byXPts.find(
        (p) =>
          p.position === cur.position &&
          !selected.has(p.id) &&
          p.xPts > cur.xPts &&
          p.nowCost <= avail &&
          (clubCounts.get(p.teamId) ?? 0) < 3,
      );
      if (!upgrade) continue;
      selected.delete(cur.id);
      selected.add(upgrade.id);
      starters[i] = upgrade;
      budget = avail - upgrade.nowCost;
      clubCounts.set(cur.teamId, Math.max(0, (clubCounts.get(cur.teamId) ?? 0) - 1));
      clubCounts.set(upgrade.teamId, (clubCounts.get(upgrade.teamId) ?? 0) + 1);
    }
  }

  // ── Step 4: Fill bench ─────────────────────────────────────────────────────

  // Bench GK: cheapest eligible goalkeeper
  const benchGK = gkByCost.find(
    (p) => !selected.has(p.id) && (clubCounts.get(p.teamId) ?? 0) < 3 && p.nowCost <= budget,
  );
  if (benchGK) {
    selected.add(benchGK.id);
    budget -= benchGK.nowCost;
    clubCounts.set(benchGK.teamId, (clubCounts.get(benchGK.teamId) ?? 0) + 1);
  }

  // Determine bench outfield positions: fill remaining squad slots (5 DEF, 5 MID, 3 FWD total)
  const startCount: Record<PlayerPosition, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const p of starters) startCount[p.position]++;
  const benchOutfieldSlots: PlayerPosition[] = [];
  (['DEF', 'MID', 'FWD'] as const).forEach((pos) => {
    const total = pos === 'FWD' ? 3 : 5;
    for (let i = startCount[pos]; i < total; i++) benchOutfieldSlots.push(pos);
  });

  // Priority sub (bench slot 1): highest-xPts eligible player for any bench outfield position.
  // Reserve minimum for remaining filler slots before committing to priority sub budget.
  const fillerReserve = outfieldByCost
    .filter((p) => !selected.has(p.id) && (clubCounts.get(p.teamId) ?? 0) < 3)
    .slice(0, benchOutfieldSlots.length - 1)
    .reduce((s, p) => s + p.nowCost, 0);

  const prioritySub = byXPts.find(
    (p) =>
      p.position !== 'GK' &&
      !selected.has(p.id) &&
      (clubCounts.get(p.teamId) ?? 0) < 3 &&
      benchOutfieldSlots.includes(p.position) &&
      p.nowCost <= budget - fillerReserve,
  );
  if (prioritySub) {
    selected.add(prioritySub.id);
    budget -= prioritySub.nowCost;
    clubCounts.set(prioritySub.teamId, (clubCounts.get(prioritySub.teamId) ?? 0) + 1);
  }

  // Fillers: cheapest eligible player for each remaining bench outfield position
  const fillerSlots = [...benchOutfieldSlots];
  if (prioritySub) {
    const idx = fillerSlots.indexOf(prioritySub.position);
    if (idx !== -1) fillerSlots.splice(idx, 1);
  }
  const fillers: OptimizerPlayer[] = [];
  for (const pos of fillerSlots) {
    const filler = outfieldByCost.find(
      (p) =>
        p.position === pos &&
        !selected.has(p.id) &&
        (clubCounts.get(p.teamId) ?? 0) < 3 &&
        p.nowCost <= budget,
    );
    if (!filler) continue;
    fillers.push(filler);
    selected.add(filler.id);
    budget -= filler.nowCost;
    clubCounts.set(filler.teamId, (clubCounts.get(filler.teamId) ?? 0) + 1);
  }

  // ── Step 5: Build ordered squad ────────────────────────────────────────────
  // starters ordered as [GK, DEF..., MID..., FWD...] by best formation
  // bench ordered as [benchGK, prioritySub, filler1, filler2]
  const { starters: orderedStarters } = pickBestFormation(starters);
  const totalXPts = orderedStarters.reduce((sum, p) => sum + p.xPts, 0);
  const orderedSquad = [
    ...orderedStarters.map((p) => p.id),
    ...(benchGK ? [benchGK.id] : []),
    ...(prioritySub ? [prioritySub.id] : []),
    ...fillers.map((p) => p.id),
  ];

  const selectedCost = totalBudget - budget;
  return { orderedSquad, totalXPts, targetGw, selectedCost };
}
