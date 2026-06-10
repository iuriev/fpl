import type { FPLBootstrapStatic, FPLFixture, FPLHistory, FPLPicks } from './fpl-client';
import type { ActiveChip, ChipMetric, ChipRecommendation, ChipStrategyResponse } from './types';

export interface SquadPick {
  elementId: number;
  fplCode: number;
  teamId: number;
  isBench: boolean;
  seasonAvgPts: number;
}

export interface TeamFdrEntry {
  home: number;
  away: number;
}

export interface ChipStrategyInput {
  bootstrap: FPLBootstrapStatic;
  picks: FPLPicks;
  history: FPLHistory;
  fixtures: FPLFixture[];
  currentGw: number;
  predMap: Map<number, Map<number, number>>;
}

type ChipName = Exclude<ActiveChip, null>;

// ─── fixture utilities ───────────────────────────────────────────────────────

export function computeFixturesByTeamGw(fixtures: FPLFixture[]): Map<number, Map<number, number>> {
  const result = new Map<number, Map<number, number>>();

  function inc(teamId: number, gw: number): void {
    if (!result.has(teamId)) result.set(teamId, new Map());
    const m = result.get(teamId)!;
    m.set(gw, (m.get(gw) ?? 0) + 1);
  }

  for (const f of fixtures) {
    if (f.event == null) continue;
    inc(f.team_h, f.event);
    inc(f.team_a, f.event);
  }

  return result;
}

// ─── xPts resolution ────────────────────────────────────────────────────────

export function resolvePlayerXPts(
  fplCode: number,
  gw: number,
  predMap: Map<number, Map<number, number>>,
  seasonAvgPts: number,
  fdr: number,
): number {
  const xPts = predMap.get(fplCode)?.get(gw);
  if (xPts !== undefined) return xPts;
  return seasonAvgPts * (1 - ((fdr - 1) / 4) * 0.3);
}

// ─── internal helpers ────────────────────────────────────────────────────────

function getAvgFdr(teamId: number, teamFdr: Map<number, TeamFdrEntry>): number {
  const e = teamFdr.get(teamId);
  if (!e) return 3;
  return (e.home + e.away) / 2;
}

function getFixtureCount(
  teamId: number,
  gw: number,
  fc: Map<number, Map<number, number>>,
): number {
  return fc.get(teamId)?.get(gw) ?? 0;
}

function isTeamDgw(
  teamId: number,
  gw: number,
  fc: Map<number, Map<number, number>>,
): boolean {
  return getFixtureCount(teamId, gw, fc) >= 2;
}

// ─── chip value functions ────────────────────────────────────────────────────

export function computeBbValue(
  gw: number,
  allPicks: SquadPick[],
  predMap: Map<number, Map<number, number>>,
  fc: Map<number, Map<number, number>>,
  teamFdr: Map<number, TeamFdrEntry>,
): number {
  const bench = allPicks.filter(p => p.isBench);
  let sum = 0;
  let dgwCount = 0;

  for (const p of bench) {
    sum += resolvePlayerXPts(p.fplCode, gw, predMap, p.seasonAvgPts, getAvgFdr(p.teamId, teamFdr));
    if (isTeamDgw(p.teamId, gw, fc)) dgwCount++;
  }

  return sum * (dgwCount >= 2 ? 1.8 : 1.0);
}

export function computeTcValue(
  gw: number,
  starters: SquadPick[],
  predMap: Map<number, Map<number, number>>,
  fc: Map<number, Map<number, number>>,
  teamFdr: Map<number, TeamFdrEntry>,
): number {
  let bestXPts = 0;
  let bestTeamId = 0;

  for (const p of starters) {
    const xPts = resolvePlayerXPts(
      p.fplCode, gw, predMap, p.seasonAvgPts, getAvgFdr(p.teamId, teamFdr),
    );
    if (xPts > bestXPts) {
      bestXPts = xPts;
      bestTeamId = p.teamId;
    }
  }

  return bestXPts * (isTeamDgw(bestTeamId, gw, fc) ? 1.8 : 1.0);
}

export function computeFhValue(
  gw: number,
  starters: SquadPick[],
  fc: Map<number, Map<number, number>>,
): number {
  const total = starters.length;
  if (total === 0) return 0;

  let withFixture = 0;
  let blanking = 0;
  let dgwCount = 0;

  for (const p of starters) {
    const count = getFixtureCount(p.teamId, gw, fc);
    if (count > 0) withFixture++;
    else blanking++;
    if (count >= 2) dgwCount++;
  }

  const coverage = withFixture / total;
  const bgwBonus = blanking >= 2 ? 2.0 : 1.0;
  const dgwBonus = dgwCount >= 2 ? 1.4 : 1.0;
  return (1 - coverage) * bgwBonus * dgwBonus;
}

export function computeWcValue(
  gw: number,
  starters: SquadPick[],
  teamFdr: Map<number, TeamFdrEntry>,
  fc: Map<number, Map<number, number>>,
  horizon: number,
): number {
  let total = 0;
  let count = 0;

  for (const p of starters) {
    const fdr = getAvgFdr(p.teamId, teamFdr);
    for (let g = gw; g < gw + horizon; g++) {
      if (getFixtureCount(p.teamId, g, fc) > 0) {
        total += fdr;
        count++;
      }
    }
  }

  return count > 0 ? total / count : 0;
}

// ─── optimizer ───────────────────────────────────────────────────────────────

export function assignChips(
  chips: ChipName[],
  values: Record<string, Map<number, number>>,
): Record<string, number> {
  const allGws = new Set(chips.flatMap(c => [...(values[c]?.keys() ?? [])]));
  const relaxed = allGws.size < chips.length;

  if (relaxed) {
    const result: Record<string, number> = {};
    for (const chip of chips) {
      const map = values[chip];
      if (!map || map.size === 0) continue;
      let bestGw = 0;
      let bestVal = -Infinity;
      for (const [gw, val] of map) {
        if (val > bestVal) { bestVal = val; bestGw = gw; }
      }
      result[chip] = bestGw;
    }
    return result;
  }

  let bestTotal = -Infinity;
  let bestAssignment = chips.map(() => 0);

  function permute(idx: number, used: Set<number>, current: number[], total: number): void {
    if (idx === chips.length) {
      if (total > bestTotal) { bestTotal = total; bestAssignment = [...current]; }
      return;
    }
    const map = values[chips[idx]];
    if (!map) return;
    for (const [gw, val] of map) {
      if (!used.has(gw)) {
        used.add(gw);
        current.push(gw);
        permute(idx + 1, used, current, total + val);
        current.pop();
        used.delete(gw);
      }
    }
  }

  permute(0, new Set(), [], 0);

  const result: Record<string, number> = {};
  chips.forEach((c, i) => { result[c] = bestAssignment[i]; });
  return result;
}

// ─── rationale & metrics ─────────────────────────────────────────────────────

type RationaleData = {
  gwFrom?: number; gwTo?: number; avgFdr?: number;
  dgw?: boolean; playersWithFixture?: number; totalPlayers?: number;
  topBenchPlayers?: string[]; benchXPts?: number;
  playerName?: string; fixture?: string; fdr?: number; xPts?: number;
  bgw?: boolean; blankingCount?: number;
};

export function buildRationale(chip: ChipName, data: RationaleData): string {
  if (chip === 'wildcard') {
    const { avgFdr = 3, gwFrom = 0, gwTo = 0 } = data;
    return `Squad heading into tough run: avg FDR ${avgFdr} from GW${gwFrom}–GW${gwTo}.`;
  }

  if (chip === 'bboost') {
    const { dgw, playersWithFixture = 0, totalPlayers = 15, topBenchPlayers = [] } = data;
    if (dgw) {
      const players = topBenchPlayers.slice(0, 2).join(' + ');
      return `Double gameweek — ${playersWithFixture}/${totalPlayers} players play twice. ${players} both in DGW.`;
    }
    return `All ${totalPlayers} players with a fixture. Bench total: ${data.benchXPts ?? 0} xPts.`;
  }

  if (chip === '3xc') {
    const { playerName = 'N/A', fixture = 'N/A', xPts = 0 } = data;
    return `${playerName} vs ${fixture} — best xPts this gameweek (${xPts}).`;
  }

  if (data.bgw) {
    return `Blank gameweek — ${data.blankingCount ?? 0} starters without a fixture. Free Hit provides a full squad.`;
  }
  return `Double gameweek — Free Hit allows picking the best players with double fixtures.`;
}

type MetricsData = {
  avgFdr?: number; runLength?: number; xPtsLoss?: number;
  playersWithFixture?: number; totalPlayers?: number; benchXPts?: number; dgw?: boolean;
  playerName?: string; xPts?: number; captainFdr?: number;
  coverage?: number; blankingCount?: number; gwType?: string;
  approximated?: boolean;
};

export function buildMetrics(chip: ChipName, data: MetricsData): ChipMetric[] {
  const prefix = data.approximated ? '~' : '';

  if (chip === 'wildcard') {
    return [
      { label: 'avg FDR', value: `${prefix}${data.avgFdr ?? 3}` },
      { label: 'tough run', value: `${data.runLength ?? 4} GWs` },
      { label: 'xPts loss', value: `${prefix}−${data.xPtsLoss ?? 0}` },
    ];
  }

  if (chip === 'bboost') {
    return [
      { label: 'with fixture', value: `${data.playersWithFixture ?? 0}/${data.totalPlayers ?? 15}` },
      { label: 'bench xPts', value: `${prefix}+${data.benchXPts ?? 0}` },
      { label: data.dgw ? 'DGW' : 'GW type', value: data.dgw ? '×2' : 'normal' },
    ];
  }

  if (chip === '3xc') {
    return [
      { label: 'captain', value: data.playerName ?? 'N/A' },
      { label: 'xPts', value: `${prefix}${data.xPts ?? 0}` },
      { label: 'FDR', value: `${data.captainFdr ?? 3}` },
    ];
  }

  return [
    { label: 'without fixture', value: `${data.blankingCount ?? 0}` },
    { label: 'coverage', value: `${data.coverage ?? 0}/11` },
    { label: 'type', value: data.gwType ?? 'BGW' },
  ];
}

// ─── main entry point ────────────────────────────────────────────────────────

const ALL_CHIPS: ChipName[] = ['wildcard', 'freehit', 'bboost', '3xc'];
const WC_HORIZON = 4;

export async function computeChipStrategy(input: ChipStrategyInput): Promise<ChipStrategyResponse> {
  const { bootstrap, picks, history, fixtures, currentGw, predMap } = input;

  const windowEntry = bootstrap.chips.find(
    c => currentGw >= c.start_event && currentGw <= c.stop_event,
  );
  const windowStop = windowEntry?.stop_event ?? 38;
  const candidates = Array.from({ length: windowStop - currentGw + 1 }, (_, i) => currentGw + i);

  const usedChips = new Map<string, number>();
  for (const c of history.chips) usedChips.set(c.name, c.event);
  const activeChipName = picks.active_chip as ChipName | null;

  const elementMap = new Map(bootstrap.elements.map(e => [e.id, e]));
  const elementNameByCode = new Map(bootstrap.elements.map(e => [e.code, e.web_name]));
  const finishedCount = bootstrap.events.filter(e => e.finished).length;
  const gamesPlayed = Math.max(finishedCount, 1);

  const allPicks: SquadPick[] = picks.picks.map(pick => {
    const el = elementMap.get(pick.element);
    return {
      elementId: pick.element,
      fplCode: el?.code ?? pick.element,
      teamId: el?.team ?? 0,
      isBench: pick.position > 11,
      seasonAvgPts: el ? el.total_points / gamesPlayed : 3,
    };
  });

  const starters = allPicks.filter(p => !p.isBench);
  const fc = computeFixturesByTeamGw(fixtures);

  const teamFdrMap = new Map<number, TeamFdrEntry>(
    bootstrap.teams.map(t => [t.id, { home: 3, away: 3 }]),
  );
  for (const f of fixtures) {
    if (!f.event) continue;
    const h = teamFdrMap.get(f.team_h) ?? { home: 3, away: 3 };
    const a = teamFdrMap.get(f.team_a) ?? { home: 3, away: 3 };
    teamFdrMap.set(f.team_h, { home: f.team_h_difficulty, away: h.away });
    teamFdrMap.set(f.team_a, { home: a.home, away: f.team_a_difficulty });
  }

  const availableChips = ALL_CHIPS.filter(c => !usedChips.has(c) && c !== activeChipName);
  const valueMap: Record<string, Map<number, number>> = {};

  for (const gw of candidates) {
    const earlyPenalty = gw <= 2 ? 0.2 : 1.0;
    const wcUsedGw = usedChips.get('wildcard');
    const fhCoolPenalty =
      wcUsedGw !== undefined && gw >= wcUsedGw + 1 && gw <= wcUsedGw + 3 ? 0.1 : 1.0;

    for (const chip of availableChips) {
      if (!valueMap[chip]) valueMap[chip] = new Map();
      let val: number;
      if (chip === 'bboost') {
        val = computeBbValue(gw, allPicks, predMap, fc, teamFdrMap) * earlyPenalty;
      } else if (chip === '3xc') {
        val = computeTcValue(gw, starters, predMap, fc, teamFdrMap) * earlyPenalty;
      } else if (chip === 'freehit') {
        val = computeFhValue(gw, starters, fc) * fhCoolPenalty;
      } else {
        val = computeWcValue(gw, starters, teamFdrMap, fc, WC_HORIZON) * earlyPenalty;
      }
      valueMap[chip].set(gw, val);
    }
  }

  const assignment = assignChips(availableChips, valueMap);

  const result: ChipRecommendation[] = [];

  for (const chip of ALL_CHIPS) {
    if (usedChips.has(chip)) {
      result.push({ chip, status: 'used', usedInGw: usedChips.get(chip)!, metrics: [], rationale: '' });
      continue;
    }

    if (chip === activeChipName) {
      result.push({ chip, status: 'active', metrics: [], rationale: '' });
      continue;
    }

    const recommendedGw = assignment[chip] ?? candidates[0] ?? currentGw;
    let rationaleData: RationaleData = {};
    let metricsData: MetricsData = {};
    let isDgw: boolean | undefined;
    let isBgw: boolean | undefined;

    if (chip === 'wildcard') {
      let totalFdr = 0;
      let cnt = 0;
      for (const p of starters) {
        const fdr = getAvgFdr(p.teamId, teamFdrMap);
        for (let g = recommendedGw; g < recommendedGw + WC_HORIZON; g++) {
          if (getFixtureCount(p.teamId, g, fc) > 0) { totalFdr += fdr; cnt++; }
        }
      }
      const avgFdrVal = cnt > 0 ? +(totalFdr / cnt).toFixed(1) : 3.0;
      const starterXPts = starters.reduce((sum, p) =>
        sum + resolvePlayerXPts(p.fplCode, recommendedGw, predMap, p.seasonAvgPts, getAvgFdr(p.teamId, teamFdrMap)), 0);
      const xPtsLoss = Math.round(starterXPts * Math.max(avgFdrVal - 3, 0));
      rationaleData = { avgFdr: avgFdrVal, gwFrom: recommendedGw, gwTo: recommendedGw + WC_HORIZON - 1 };
      metricsData = { avgFdr: avgFdrVal, runLength: WC_HORIZON, xPtsLoss };
    }

    if (chip === 'bboost') {
      const bench = allPicks.filter(p => p.isBench);
      let sum = 0;
      let dgwBenchCount = 0;
      const dgwBenchPlayers: { name: string; xPts: number }[] = [];
      const playersWithFixture = allPicks.filter(
        p => getFixtureCount(p.teamId, recommendedGw, fc) > 0,
      ).length;

      for (const p of bench) {
        const xPts = resolvePlayerXPts(
          p.fplCode, recommendedGw, predMap, p.seasonAvgPts, getAvgFdr(p.teamId, teamFdrMap),
        );
        sum += xPts;
        if (isTeamDgw(p.teamId, recommendedGw, fc)) {
          dgwBenchCount++;
          dgwBenchPlayers.push({ name: elementNameByCode.get(p.fplCode) ?? 'N/A', xPts });
        }
      }

      dgwBenchPlayers.sort((a, b) => b.xPts - a.xPts);
      isDgw = dgwBenchCount >= 2 || undefined;
      rationaleData = {
        dgw: dgwBenchCount >= 2,
        playersWithFixture,
        totalPlayers: allPicks.length,
        topBenchPlayers: dgwBenchPlayers.slice(0, 2).map(p => p.name),
        benchXPts: +sum.toFixed(1),
      };
      metricsData = {
        playersWithFixture,
        totalPlayers: allPicks.length,
        benchXPts: +sum.toFixed(1),
        dgw: dgwBenchCount >= 2,
      };
    }

    if (chip === '3xc') {
      let bestXPts = 0;
      let bestPick: SquadPick | null = null;
      for (const p of starters) {
        const xPts = resolvePlayerXPts(
          p.fplCode, recommendedGw, predMap, p.seasonAvgPts, getAvgFdr(p.teamId, teamFdrMap),
        );
        if (xPts > bestXPts) { bestXPts = xPts; bestPick = p; }
      }
      isDgw = bestPick ? isTeamDgw(bestPick.teamId, recommendedGw, fc) || undefined : undefined;
      const playerName = bestPick ? (elementNameByCode.get(bestPick.fplCode) ?? 'N/A') : 'N/A';
      const captainFdr = bestPick ? Math.round(getAvgFdr(bestPick.teamId, teamFdrMap)) : 3;
      rationaleData = { playerName, fixture: 'N/A', fdr: captainFdr, xPts: +bestXPts.toFixed(1) };
      metricsData = { playerName, xPts: +bestXPts.toFixed(1), captainFdr };
    }

    if (chip === 'freehit') {
      let withFixture = 0;
      let blanking = 0;
      for (const p of starters) {
        if (getFixtureCount(p.teamId, recommendedGw, fc) > 0) withFixture++;
        else blanking++;
      }
      isBgw = blanking >= 2 || undefined;
      rationaleData = { bgw: blanking >= 2, blankingCount: blanking };
      metricsData = {
        blankingCount: blanking,
        coverage: withFixture,
        gwType: blanking >= 2 ? 'BGW' : 'DGW',
      };
    }

    result.push({
      chip,
      status: 'recommended',
      recommendedGw,
      isDgw,
      isBgw,
      metrics: buildMetrics(chip, metricsData),
      rationale: buildRationale(chip, rationaleData),
    });
  }

  return result;
}
