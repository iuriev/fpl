import type { PlayerPosition, PredictionConfidence } from './types';

export interface OptimizerPlayer {
  id: number;
  position: PlayerPosition;
  teamId: number;
  nowCost: number;
  xPts: number;
  playConfidence?: PredictionConfidence;
}

export interface FreeHitSquadPlayer {
  id: number;
  position: PlayerPosition;
  nowCost: number;
  xPts: number;
}

export function findXiBenchXPtsIssues(
  orderedSquad: number[],
  playersById: Map<number, Pick<OptimizerPlayer, 'position' | 'xPts'>>,
): string[] {
  if (orderedSquad.length < 15) return [];
  const issues: string[] = [];
  const starters = orderedSquad.slice(0, 11).map((id) => playersById.get(id));
  const bench = orderedSquad.slice(11).map((id) => playersById.get(id));
  if (starters.some((p) => !p) || bench.some((p) => !p)) return ['missing player data'];

  for (const pos of ['DEF', 'MID', 'FWD'] as const) {
    const xiPos = starters.filter((p) => p?.position === pos) as OptimizerPlayer[];
    const benchPos = bench.filter((p) => p?.position === pos) as OptimizerPlayer[];
    if (xiPos.length === 0 || benchPos.length === 0) continue;
    const weakest = Math.min(...xiPos.map((p) => p.xPts));
    for (const b of benchPos) {
      if (b.xPts > weakest + 0.001) {
        issues.push(
          `${pos} bench ${b.xPts} exceeds weakest starter ${weakest}`,
        );
      }
    }
  }

  const benchOutfield = bench.filter((p) => p?.position !== 'GK') as OptimizerPlayer[];
  for (let i = 1; i < benchOutfield.length; i++) {
    if (benchOutfield[i].xPts > benchOutfield[i - 1].xPts + 0.001) {
      issues.push('outfield bench not sorted by descending xPts');
      break;
    }
  }

  return issues;
}

export interface FreeHitResult {
  orderedSquad: number[];
  players: FreeHitSquadPlayer[];
  totalXPts: number;
  targetGw: number;
  totalBudget: number;
  selectedCost: number;
  remainingBudget: number;
}

const SQUAD_LIMITS: Record<PlayerPosition, number> = {
  GK: 2,
  DEF: 5,
  MID: 5,
  FWD: 3,
};

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

function minCostForBenchSlots(
  slots: PlayerPosition[],
  byCost: OptimizerPlayer[],
  selected: Set<number>,
  clubCounts: Map<number, number>,
): number {
  let total = 0;
  const used = new Set(selected);
  const counts = new Map(clubCounts);
  for (const pos of slots) {
    const player = byCost.find(
      (p) =>
        p.position === pos && !used.has(p.id) && (counts.get(p.teamId) ?? 0) < 3,
    );
    if (!player) return Infinity;
    total += player.nowCost;
    used.add(player.id);
    counts.set(player.teamId, (counts.get(player.teamId) ?? 0) + 1);
  }
  return total;
}

function countPositions(
  squad: OptimizerPlayer[]
): Record<PlayerPosition, number> {
  const counts: Record<PlayerPosition, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const p of squad) counts[p.position]++;
  return counts;
}

function pickCheapest(
  pos: PlayerPosition,
  byCost: OptimizerPlayer[],
  selected: Set<number>,
  clubCounts: Map<number, number>,
  maxCost: number,
  exclude: Set<number> = new Set()
): OptimizerPlayer | undefined {
  return byCost.find(
    (p) =>
      p.position === pos &&
      !selected.has(p.id) &&
      !exclude.has(p.id) &&
      (clubCounts.get(p.teamId) ?? 0) < 3 &&
      p.nowCost <= maxCost
  );
}

function pickCheapestRelaxed(
  pos: PlayerPosition,
  byCost: OptimizerPlayer[],
  selected: Set<number>,
  maxCost: number
): OptimizerPlayer | undefined {
  return byCost.find(
    (p) => p.position === pos && !selected.has(p.id) && p.nowCost <= maxCost
  );
}

function fillMandatoryBench(
  orderedStarters: OptimizerPlayer[],
  selected: Set<number>,
  budget: number,
  clubCounts: Map<number, number>,
  gkByCost: OptimizerPlayer[],
  outfieldByCost: OptimizerPlayer[],
  releasedFromXi: Set<number>
): {
  benchGK: OptimizerPlayer | null;
  fillers: OptimizerPlayer[];
  budget: number;
} {
  let benchGK: OptimizerPlayer | null = null;
  const fillers: OptimizerPlayer[] = [];

  const tryFill = (excludeReleased: boolean): boolean => {
    benchGK = null;
    fillers.length = 0;
    const trialSelected = new Set(selected);
    const trialCounts = new Map(clubCounts);
    let trialBudget = budget;

    const startCount = countPositions(orderedStarters);
    const benchOutfieldSlots: PlayerPosition[] = [];
    (['DEF', 'MID', 'FWD'] as const).forEach((pos) => {
      for (let i = startCount[pos]; i < SQUAD_LIMITS[pos]; i++) {
        benchOutfieldSlots.push(pos);
      }
    });

    const exclude = excludeReleased ? releasedFromXi : new Set<number>();

    const gk = pickCheapest('GK', gkByCost, trialSelected, trialCounts, trialBudget, exclude);
    if (!gk) return false;
    trialSelected.add(gk.id);
    trialBudget -= gk.nowCost;
    trialCounts.set(gk.teamId, (trialCounts.get(gk.teamId) ?? 0) + 1);
    benchGK = gk;

    for (let i = 0; i < benchOutfieldSlots.length; i++) {
      const pos = benchOutfieldSlots[i];
      const remaining = benchOutfieldSlots.slice(i + 1);
      const reserve = minCostForBenchSlots(remaining, outfieldByCost, trialSelected, trialCounts);
      const filler = pickCheapest(pos, outfieldByCost, trialSelected, trialCounts, trialBudget - reserve, exclude);
      if (!filler) return false;
      fillers.push(filler);
      trialSelected.add(filler.id);
      trialBudget -= filler.nowCost;
      trialCounts.set(filler.teamId, (trialCounts.get(filler.teamId) ?? 0) + 1);
    }

    selected.clear();
    for (const id of trialSelected) selected.add(id);
    clubCounts.clear();
    for (const [k, v] of trialCounts) clubCounts.set(k, v);
    return true;
  };

  if (!tryFill(true) && !tryFill(false)) {
    return { benchGK: null, fillers: [], budget };
  }

  const resolvedBenchGK = benchGK as OptimizerPlayer | null;
  const newBudget =
    budget -
    (resolvedBenchGK?.nowCost ?? 0) -
    fillers.reduce((sum, p) => sum + p.nowCost, 0);
  return { benchGK: resolvedBenchGK, fillers, budget: newBudget };
}

function isScoringCandidate(p: OptimizerPlayer): boolean {
  return p.xPts > 0;
}

function playConfidenceRank(confidence?: PredictionConfidence): number {
  if (confidence === 'high') return 3;
  if (confidence === 'medium') return 2;
  if (confidence === 'low') return 1;
  return 2;
}

function isPlayableBenchEnabler(p: OptimizerPlayer): boolean {
  if (p.xPts <= 0) return false;
  if (p.playConfidence === 'low') return false;
  return true;
}

function pickPrimaryBenchUpgrade(
  current: OptimizerPlayer,
  remaining: number,
  selected: Set<number>,
  clubCounts: Map<number, number>,
  byXPts: OptimizerPlayer[],
): OptimizerPlayer | undefined {
  const affordable = byXPts.filter(
    (p) =>
      p.position === current.position &&
      !selected.has(p.id) &&
      p.nowCost <= current.nowCost + remaining &&
      p.nowCost > current.nowCost &&
      (clubCounts.get(p.teamId) ?? 0) < 3 &&
      (p.xPts > current.xPts || p.xPts === current.xPts),
  );
  affordable.sort((a, b) => b.xPts - a.xPts || b.nowCost - a.nowCost);
  return affordable[0];
}

function pickThirdBenchEnabler(
  current: OptimizerPlayer,
  remaining: number,
  selected: Set<number>,
  clubCounts: Map<number, number>,
  byCost: OptimizerPlayer[],
): OptimizerPlayer | undefined {
  const affordable = byCost.filter(
    (p) =>
      p.position === current.position &&
      !selected.has(p.id) &&
      isPlayableBenchEnabler(p) &&
      p.nowCost <= current.nowCost + remaining &&
      (clubCounts.get(p.teamId) ?? 0) < 3,
  );
  affordable.sort(
    (a, b) =>
      a.nowCost - b.nowCost ||
      playConfidenceRank(b.playConfidence) - playConfidenceRank(a.playConfidence) ||
      b.xPts - a.xPts,
  );
  const pick = affordable[0];
  if (!pick || pick.id === current.id) return undefined;
  return pick;
}

function benchOutfieldRoles(
  fillers: OptimizerPlayer[],
): { premium: number[]; enabler: number } {
  const ranked = fillers
    .map((pl, index) => ({ pl, index }))
    .sort((a, b) => b.pl.xPts - a.pl.xPts || b.pl.nowCost - a.pl.nowCost);
  return {
    premium: [ranked[0]?.index ?? 0, ranked[1]?.index ?? 1],
    enabler: ranked[2]?.index ?? 2,
  };
}

function applyPlayerSwap(
  current: OptimizerPlayer,
  upgrade: OptimizerPlayer,
  selected: Set<number>,
  clubCounts: Map<number, number>,
): number {
  selected.delete(current.id);
  selected.add(upgrade.id);
  clubCounts.set(current.teamId, Math.max(0, (clubCounts.get(current.teamId) ?? 0) - 1));
  clubCounts.set(upgrade.teamId, (clubCounts.get(upgrade.teamId) ?? 0) + 1);
  return upgrade.nowCost - current.nowCost;
}

function spendRemainingBudgetOnSquad(
  fullSquad: OptimizerPlayer[],
  budget: number,
  players: OptimizerPlayer[],
): { squad: OptimizerPlayer[]; budget: number } {
  let remaining = budget;
  const squad = [...fullSquad];
  const byXPts = [...players].filter(isScoringCandidate).sort((a, b) => b.xPts - a.xPts);

  for (let round = 0; round < 80; round++) {
    const selected = new Set(squad.map((p) => p.id));
    const clubCounts = new Map<number, number>();
    for (const p of squad) {
      clubCounts.set(p.teamId, (clubCounts.get(p.teamId) ?? 0) + 1);
    }

    const upgradeOrder = [...squad].sort((a, b) => a.xPts - b.xPts || a.nowCost - b.nowCost);
    let improved = false;
    for (const current of upgradeOrder) {
      const avail = remaining + current.nowCost;
      const upgrade = byXPts.find(
        (p) =>
          p.position === current.position &&
          !selected.has(p.id) &&
          p.nowCost <= avail &&
          p.nowCost > current.nowCost &&
          (clubCounts.get(p.teamId) ?? 0) < 3 &&
          (p.xPts > current.xPts || p.xPts === current.xPts),
      );
      if (!upgrade) continue;
      const idx = squad.findIndex((p) => p.id === current.id);
      if (idx === -1) continue;
      remaining -= upgrade.nowCost - current.nowCost;
      squad[idx] = upgrade;
      improved = true;
      break;
    }
    if (!improved) break;
  }

  return { squad, budget: remaining };
}

function finalizeSquadLayout(fullSquad: OptimizerPlayer[]): {
  orderedStarters: OptimizerPlayer[];
  benchGK: OptimizerPlayer | null;
  fillers: OptimizerPlayer[];
  totalXPts: number;
} {
  const { starters } = pickBestFormation(fullSquad);
  const bench = fullSquad.filter((p) => !starters.some((s) => s.id === p.id));
  const benchGK = bench.find((p) => p.position === 'GK') ?? null;
  const fillers = bench
    .filter((p) => p.position !== 'GK')
    .sort((a, b) => b.xPts - a.xPts);
  return {
    orderedStarters: starters,
    benchGK,
    fillers,
    totalXPts: starters.reduce((sum, p) => sum + p.xPts, 0),
  };
}

function investRemainingBudget(
  orderedStarters: OptimizerPlayer[],
  benchGK: OptimizerPlayer | null,
  fillers: OptimizerPlayer[],
  selected: Set<number>,
  clubCounts: Map<number, number>,
  budget: number,
  byXPts: OptimizerPlayer[],
  byCost: OptimizerPlayer[],
  releasedFromXi: Set<number>,
): {
  orderedStarters: OptimizerPlayer[];
  benchGK: OptimizerPlayer | null;
  fillers: OptimizerPlayer[];
  budget: number;
} {
  let remaining = budget;
  let gk = benchGK;
  let benchOutfield = [...fillers];
  let xi = [...orderedStarters];

  for (let round = 0; round < 30; round++) {
    let improved = false;
    const roles = benchOutfieldRoles(benchOutfield);

    if (gk) {
      const upgrade = pickPrimaryBenchUpgrade(gk, remaining, selected, clubCounts, byXPts);
      if (upgrade) {
        remaining -= applyPlayerSwap(gk, upgrade, selected, clubCounts);
        gk = upgrade;
        improved = true;
      }
    }

    for (const index of roles.premium) {
      const current = benchOutfield[index];
      if (!current) continue;
      const upgrade = pickPrimaryBenchUpgrade(current, remaining, selected, clubCounts, byXPts);
      if (!upgrade) continue;
      remaining -= applyPlayerSwap(current, upgrade, selected, clubCounts);
      benchOutfield[index] = upgrade;
      improved = true;
    }

    const enabler = benchOutfield[roles.enabler];
    if (enabler) {
      const cheaper = pickThirdBenchEnabler(enabler, remaining, selected, clubCounts, byCost);
      if (cheaper) {
        remaining -= applyPlayerSwap(enabler, cheaper, selected, clubCounts);
        benchOutfield[roles.enabler] = cheaper;
        improved = true;
      }
    }

    for (let i = 0; i < xi.length; i++) {
      const cur = xi[i];
      const avail = remaining + cur.nowCost;
      const upgrade = byXPts.find(
        (p) =>
          p.position === cur.position &&
          !selected.has(p.id) &&
          !releasedFromXi.has(p.id) &&
          p.xPts > cur.xPts &&
          p.nowCost <= avail &&
          (clubCounts.get(p.teamId) ?? 0) < 3,
      );
      if (!upgrade) continue;

      remaining = avail - upgrade.nowCost;
      applyPlayerSwap(cur, upgrade, selected, clubCounts);
      xi[i] = upgrade;
      improved = true;
    }

    const fullSquad = [...xi, ...(gk ? [gk] : []), ...benchOutfield];
    if (fullSquad.length === 15) {
      const layout = finalizeSquadLayout(fullSquad);
      const starterIds = xi.map((p) => p.id).join(',');
      const nextStarterIds = layout.orderedStarters.map((p) => p.id).join(',');
      if (starterIds !== nextStarterIds) {
        xi = layout.orderedStarters;
        gk = layout.benchGK;
        benchOutfield = [...layout.fillers];
        improved = true;
      }
    }

    if (!improved) break;
  }

  const finalSquad = [...xi, ...(gk ? [gk] : []), ...benchOutfield];
  if (finalSquad.length === 15) {
    const layout = finalizeSquadLayout(finalSquad);
    return {
      orderedStarters: layout.orderedStarters,
      benchGK: layout.benchGK,
      fillers: layout.fillers,
      budget: remaining,
    };
  }

  return {
    orderedStarters: xi,
    benchGK: gk,
    fillers: benchOutfield,
    budget: remaining,
  };
}

function fillSquadToFifteen(
  squad: OptimizerPlayer[],
  players: OptimizerPlayer[],
  budget: number
): { squad: OptimizerPlayer[]; budget: number } {
  const result = [...squad];
  const selected = new Set(result.map((p) => p.id));
  const clubCounts = new Map<number, number>();
  for (const p of result) {
    clubCounts.set(p.teamId, (clubCounts.get(p.teamId) ?? 0) + 1);
  }
  let remaining = budget;
  const byCost = [...players].sort((a, b) => a.nowCost - b.nowCost);

  const missingSlots = (): PlayerPosition[] => {
    const counts = countPositions(result);
    const slots: PlayerPosition[] = [];
    (['GK', 'DEF', 'MID', 'FWD'] as const).forEach((pos) => {
      for (let i = counts[pos]; i < SQUAD_LIMITS[pos]; i++) slots.push(pos);
    });
    return slots;
  };

  for (let guard = 0; guard < 50; guard++) {
    const slots = missingSlots();
    if (slots.length === 0) break;

    let added = false;
    for (const pos of slots) {
      const pick = byCost.find(
        (p) =>
          p.position === pos &&
          !selected.has(p.id) &&
          (clubCounts.get(p.teamId) ?? 0) < 3 &&
          p.nowCost <= remaining
      );
      if (!pick) continue;
      result.push(pick);
      selected.add(pick.id);
      remaining -= pick.nowCost;
      clubCounts.set(pick.teamId, (clubCounts.get(pick.teamId) ?? 0) + 1);
      added = true;
      break;
    }

    if (added) continue;

    const replaceable = [...result]
      .filter((p) => isScoringCandidate(p))
      .sort((a, b) => b.nowCost - a.nowCost);
    let freed = false;
    for (const expensive of replaceable) {
      const cheaper = byCost.find(
        (p) =>
          p.position === expensive.position &&
          !selected.has(p.id) &&
          p.nowCost < expensive.nowCost &&
          (clubCounts.get(p.teamId) ?? 0) < 3
      );
      if (!cheaper) continue;
      const idx = result.findIndex((p) => p.id === expensive.id);
      if (idx === -1) continue;
      const delta = expensive.nowCost - cheaper.nowCost;
      selected.delete(expensive.id);
      selected.add(cheaper.id);
      clubCounts.set(expensive.teamId, Math.max(0, (clubCounts.get(expensive.teamId) ?? 0) - 1));
      clubCounts.set(cheaper.teamId, (clubCounts.get(cheaper.teamId) ?? 0) + 1);
      result[idx] = cheaper;
      remaining += delta;
      freed = true;
      break;
    }
    if (!freed) break;
  }

  return { squad: result, budget: remaining };
}

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

function buildCheapestFifteen(
  totalBudget: number,
  players: OptimizerPlayer[]
): OptimizerPlayer[] {
  const byCost = [...players].sort((a, b) => a.nowCost - b.nowCost);

  const assemble = (): OptimizerPlayer[] => {
    const squad: OptimizerPlayer[] = [];
    const selected = new Set<number>();
    const clubCounts = new Map<number, number>();

    const pick = (pos: PlayerPosition): void => {
      const player = byCost.find(
        (p) =>
          p.position === pos &&
          !selected.has(p.id) &&
          (clubCounts.get(p.teamId) ?? 0) < 3
      );
      if (!player) return;
      squad.push(player);
      selected.add(player.id);
      clubCounts.set(player.teamId, (clubCounts.get(player.teamId) ?? 0) + 1);
    };

    for (let i = 0; i < SQUAD_LIMITS.GK; i++) pick('GK');
    for (let i = 0; i < SQUAD_LIMITS.DEF; i++) pick('DEF');
    for (let i = 0; i < SQUAD_LIMITS.MID; i++) pick('MID');
    for (let i = 0; i < SQUAD_LIMITS.FWD; i++) pick('FWD');
    return squad;
  };

  let squad = assemble();
  for (let guard = 0; guard < 300; guard++) {
    const cost = squad.reduce((sum, p) => sum + p.nowCost, 0);
    if (squad.length === 15 && cost <= totalBudget) return squad;

    if (squad.length < 15) {
      squad = assemble();
      if (squad.length < 15) return [];
      continue;
    }

    const selected = new Set(squad.map((p) => p.id));
    const expensive = [...squad].sort((a, b) => b.nowCost - a.nowCost)[0];
    const cheaper = byCost.find(
      (p) =>
        p.position === expensive.position &&
        !selected.has(p.id) &&
        p.nowCost < expensive.nowCost
    );
    if (!cheaper) return [];
    squad = squad.map((p) => (p.id === expensive.id ? cheaper : p));
  }

  return [];
}

function toOrderedIds(starters: OptimizerPlayer[], bench: OptimizerPlayer[]): number[] {
  if (starters.length + bench.length !== 15) {
    return [...starters, ...bench].map((p) => p.id);
  }
  const benchGk = bench.find((p) => p.position === 'GK');
  const benchOutfield = bench.filter((p) => p.position !== 'GK');
  return [
    ...starters.map((p) => p.id),
    ...(benchGk ? [benchGk.id] : []),
    ...benchOutfield.map((p) => p.id),
  ];
}

function splitStartersAndBench(fullSquad: OptimizerPlayer[]): {
  starters: OptimizerPlayer[];
  benchGK: OptimizerPlayer | null;
  fillers: OptimizerPlayer[];
} {
  const layout = finalizeSquadLayout(fullSquad);
  return {
    starters: layout.orderedStarters,
    benchGK: layout.benchGK,
    fillers: layout.fillers,
  };
}

function applySquadLayout(
  fullSquad: OptimizerPlayer[],
  totalBudget: number
): {
  orderedStarters: OptimizerPlayer[];
  benchGK: OptimizerPlayer | null;
  fillers: OptimizerPlayer[];
  orderedSquad: number[];
  budget: number;
  totalXPts: number;
} {
  const layout =
    fullSquad.length >= 11
      ? finalizeSquadLayout(fullSquad)
      : {
          orderedStarters: fullSquad.slice(0, 11),
          benchGK: null,
          fillers: [],
          totalXPts: fullSquad.slice(0, 11).reduce((sum, p) => sum + p.xPts, 0),
        };
  const cost = fullSquad.reduce((sum, p) => sum + p.nowCost, 0);
  const bench = [
    ...(layout.benchGK ? [layout.benchGK] : []),
    ...layout.fillers,
  ];
  return {
    orderedStarters: layout.orderedStarters,
    benchGK: layout.benchGK,
    fillers: layout.fillers,
    orderedSquad: toOrderedIds(layout.orderedStarters, bench),
    budget: totalBudget - cost,
    totalXPts: layout.totalXPts,
  };
}

export function resolveFreeHitBudget(
  picks: {
    picks: Array<{ element: number; selling_price?: number; purchase_price?: number }>;
    entry_history: { bank?: number; value?: number };
  },
  playerNowCostById: Map<number, number>
): number {
  let squadValue = 0;
  for (const pick of picks.picks) {
    const sell = Number(
      pick.selling_price ??
        pick.purchase_price ??
        playerNowCostById.get(pick.element) ??
        0
    );
    squadValue += Number.isFinite(sell) ? sell : 0;
  }
  const bank = Number(picks.entry_history.bank ?? 0);
  const fromParts = squadValue + (Number.isFinite(bank) ? bank : 0);
  if (Number.isFinite(fromParts) && fromParts > 0) return fromParts;

  const value = Number(picks.entry_history.value ?? 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function optimizeFreeHit(
  totalBudget: number,
  players: OptimizerPlayer[],
  targetGw: number,
): FreeHitResult {
  if (!Number.isFinite(totalBudget) || totalBudget <= 0) {
    return {
      orderedSquad: [],
      players: [],
      totalXPts: 0,
      targetGw,
      totalBudget: 0,
      selectedCost: 0,
      remainingBudget: 0,
    };
  }

  const floorSquad = buildCheapestFifteen(totalBudget, players);
  const byXPts = [...players].filter(isScoringCandidate).sort((a, b) => b.xPts - a.xPts);
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
          p.nowCost <= avail - benchReserve &&
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

  // ── Step 4: Determine starting XI and release non-starters ───────────────
  // pickBestFormation selects 11 from the starters pool (up to 14 players).
  // Players in the pool but not in the best XI are released back into the
  // available pool so bench filling can use them and their budget is reclaimed.
  let { starters: orderedStarters } = pickBestFormation(starters);
  const orderedStarterIds = new Set(orderedStarters.map((p) => p.id));
  const releasedFromXi = new Set<number>();
  for (const p of starters) {
    if (!orderedStarterIds.has(p.id)) {
      selected.delete(p.id);
      releasedFromXi.add(p.id);
      budget += p.nowCost;
      clubCounts.set(p.teamId, Math.max(0, (clubCounts.get(p.teamId) ?? 0) - 1));
    }
  }

  // ── Step 5: Fill bench (mandatory — downgrade starters until 4 bench slots fit) ─
  let benchGK: OptimizerPlayer | null = null;
  let fillers: OptimizerPlayer[] = [];
  let orderedSquad: number[];
  let totalXPts: number;
  let selectedCost: number;

  for (let attempt = 0; attempt < 30; attempt++) {
    const filled = fillMandatoryBench(
      orderedStarters,
      selected,
      budget,
      clubCounts,
      gkByCost,
      outfieldByCost,
      releasedFromXi
    );
    if (filled.benchGK && filled.fillers.length === 3) {
      benchGK = filled.benchGK;
      fillers = filled.fillers;
      budget = filled.budget;
      break;
    }

    if (orderedStarters.length === 0) break;
    const downgradeIdx = orderedStarters.reduce(
      (minIdx, p, i, arr) => (p.xPts / p.nowCost < arr[minIdx].xPts / arr[minIdx].nowCost ? i : minIdx),
      0
    );
    const cur = orderedStarters[downgradeIdx];
    const cheaper = byCost.find(
      (p) =>
        p.position === cur.position &&
        !selected.has(p.id) &&
        p.nowCost < cur.nowCost &&
        (clubCounts.get(p.teamId) ?? 0) < 3
    );
    if (!cheaper) break;
    selected.delete(cur.id);
    selected.add(cheaper.id);
    budget += cur.nowCost - cheaper.nowCost;
    clubCounts.set(cur.teamId, Math.max(0, (clubCounts.get(cur.teamId) ?? 0) - 1));
    clubCounts.set(cheaper.teamId, (clubCounts.get(cheaper.teamId) ?? 0) + 1);
    orderedStarters[downgradeIdx] = cheaper;
  }

  if (!benchGK || fillers.length < 3) {
    const relaxedSelected = new Set(orderedStarters.map((p) => p.id));
    let relaxedBudget = budget;
    const startCount = countPositions(orderedStarters);
    const benchOutfieldSlots: PlayerPosition[] = [];
    (['DEF', 'MID', 'FWD'] as const).forEach((pos) => {
      for (let i = startCount[pos]; i < SQUAD_LIMITS[pos]; i++) benchOutfieldSlots.push(pos);
    });

    benchGK =
      pickCheapestRelaxed('GK', gkByCost, relaxedSelected, relaxedBudget) ?? benchGK;
    if (benchGK) {
      relaxedSelected.add(benchGK.id);
      relaxedBudget -= benchGK.nowCost;
    }
    fillers = [];
    for (const pos of benchOutfieldSlots) {
      const filler = pickCheapestRelaxed(pos, outfieldByCost, relaxedSelected, relaxedBudget);
      if (!filler) continue;
      fillers.push(filler);
      relaxedSelected.add(filler.id);
      relaxedBudget -= filler.nowCost;
    }
    selected.clear();
    for (const id of relaxedSelected) selected.add(id);
    budget = relaxedBudget;
  }

  const invested = investRemainingBudget(
    orderedStarters,
    benchGK,
    fillers,
    selected,
    clubCounts,
    budget,
    byXPts,
    byCost,
    releasedFromXi,
  );
  orderedStarters = invested.orderedStarters;
  benchGK = invested.benchGK;
  fillers = invested.fillers;
  budget = invested.budget;

  let fullSquad = [
    ...orderedStarters,
    ...(benchGK ? [benchGK] : []),
    ...fillers,
  ];
  const completed = fillSquadToFifteen(fullSquad, players, budget);
  fullSquad = completed.squad;
  budget = completed.budget;

  if (fullSquad.length >= 11) {
    const split = splitStartersAndBench(fullSquad);
    if (split.starters.length === 11) {
      orderedStarters = split.starters;
      benchGK = split.benchGK;
      fillers = split.fillers;
    }
  }

  orderedSquad = [
    ...orderedStarters.map((p) => p.id),
    ...(benchGK ? [benchGK.id] : []),
    ...fillers.map((p) => p.id),
  ];
  selectedCost = totalBudget - budget;
  totalXPts = orderedStarters.reduce((sum, p) => sum + p.xPts, 0);

  if (budget > 0) {
    const reinvested = investRemainingBudget(
      orderedStarters,
      benchGK,
      fillers,
      selected,
      clubCounts,
      budget,
      byXPts,
      byCost,
      releasedFromXi,
    );
    orderedStarters = reinvested.orderedStarters;
    benchGK = reinvested.benchGK;
    fillers = reinvested.fillers;
    budget = reinvested.budget;
    orderedSquad = [
      ...orderedStarters.map((p) => p.id),
      ...(benchGK ? [benchGK.id] : []),
      ...fillers.map((p) => p.id),
    ];
    selectedCost = totalBudget - budget;
    totalXPts = orderedStarters.reduce((sum, p) => sum + p.xPts, 0);
  }

  if (orderedStarters.length + (benchGK ? 1 : 0) + fillers.length === 15) {
    let finalSquadPlayers = [
      ...orderedStarters,
      ...(benchGK ? [benchGK] : []),
      ...fillers,
    ];
    const spent = spendRemainingBudgetOnSquad(finalSquadPlayers, budget, players);
    finalSquadPlayers = spent.squad;
    budget = spent.budget;
    const finalLayout = finalizeSquadLayout(finalSquadPlayers);
    orderedStarters = finalLayout.orderedStarters;
    benchGK = finalLayout.benchGK;
    fillers = finalLayout.fillers;
    totalXPts = finalLayout.totalXPts;
    orderedSquad = [
      ...orderedStarters.map((p) => p.id),
      ...(benchGK ? [benchGK.id] : []),
      ...fillers.map((p) => p.id),
    ];
    selectedCost = totalBudget - budget;
  }

  while (budget < 0 && orderedStarters.length > 0) {
    const starterByCostAsc = [...orderedStarters].sort((a, b) => a.nowCost - b.nowCost);
    let downgraded = false;
    for (const cur of starterByCostAsc) {
      const avail = budget + cur.nowCost;
      const cheaper = byCost.find(
        (p) =>
          p.position === cur.position &&
          !selected.has(p.id) &&
          p.nowCost < cur.nowCost &&
          p.nowCost <= avail &&
          (clubCounts.get(p.teamId) ?? 0) < 3,
      );
      if (!cheaper) continue;
      const idx = orderedStarters.findIndex((p) => p.id === cur.id);
      if (idx === -1) continue;
      selected.delete(cur.id);
      selected.add(cheaper.id);
      budget = avail - cheaper.nowCost;
      clubCounts.set(cur.teamId, Math.max(0, (clubCounts.get(cur.teamId) ?? 0) - 1));
      clubCounts.set(cheaper.teamId, (clubCounts.get(cheaper.teamId) ?? 0) + 1);
      orderedStarters[idx] = cheaper;
      totalXPts = orderedStarters.reduce((sum, p) => sum + p.xPts, 0);
      orderedSquad = [
        ...orderedStarters.map((p) => p.id),
        ...(benchGK ? [benchGK.id] : []),
        ...fillers.map((p) => p.id),
      ];
      selectedCost = totalBudget - budget;
      downgraded = true;
      break;
    }
    if (!downgraded) break;
  }

  if (orderedSquad.length !== 15 && floorSquad.length === 15) {
    const layout = applySquadLayout(floorSquad, totalBudget);
    orderedStarters = layout.orderedStarters;
    benchGK = layout.benchGK;
    fillers = layout.fillers;
    orderedSquad = layout.orderedSquad;
    budget = layout.budget;
    selectedCost = totalBudget - budget;
    totalXPts = layout.totalXPts;
  }

  const allPlayers =
    orderedSquad.length === 15
      ? orderedSquad
          .map((id) => players.find((p) => p.id === id))
          .filter((p): p is OptimizerPlayer => p !== undefined)
      : [
          ...orderedStarters,
          ...(benchGK ? [benchGK] : []),
          ...fillers,
        ];
  const squadPlayers: FreeHitSquadPlayer[] = allPlayers.map((p) => ({
    id: p.id,
    position: p.position,
    nowCost: p.nowCost,
    xPts: p.xPts,
  }));

  return {
    orderedSquad,
    players: squadPlayers,
    totalXPts,
    targetGw,
    totalBudget,
    selectedCost,
    remainingBudget: budget,
  };
}
