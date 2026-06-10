import { describe, expect, it } from 'vitest';

import type { SquadPick, TeamFdrEntry } from './chip-strategy-service';
import {
  assignChips,
  buildMetrics,
  buildRationale,
  computeBbValue,
  computeChipStrategy,
  computeFhValue,
  computeFixturesByTeamGw,
  computeTcValue,
  computeWcValue,
  resolvePlayerXPts,
} from './chip-strategy-service';
import type { FPLBootstrapStatic, FPLFixture, FPLHistory, FPLPicks } from './fpl-client';
import type { ActiveChip } from './types';

function makeFixture(teamH: number, teamA: number, event: number): FPLFixture {
  return {
    id: event * 100 + teamH,
    event,
    team_h: teamH,
    team_a: teamA,
    team_h_difficulty: 3,
    team_a_difficulty: 3,
    kickoff_time: null,
    finished: false,
    started: false,
  } as unknown as FPLFixture;
}

// ─── computeFixturesByTeamGw ────────────────────────────────────────────────

describe('computeFixturesByTeamGw', () => {
  it('counts single fixture per team per gw', () => {
    const fixtures = [makeFixture(1, 2, 5)];
    const map = computeFixturesByTeamGw(fixtures);
    expect(map.get(1)?.get(5)).toBe(1);
    expect(map.get(2)?.get(5)).toBe(1);
  });

  it('counts double gameweek correctly', () => {
    const fixtures = [makeFixture(1, 2, 5), makeFixture(3, 1, 5)];
    const map = computeFixturesByTeamGw(fixtures);
    expect(map.get(1)?.get(5)).toBe(2);
  });

  it('returns undefined for blank gameweek (team not in map)', () => {
    const fixtures = [makeFixture(1, 2, 5)];
    const map = computeFixturesByTeamGw(fixtures);
    expect(map.get(99)?.get(5) ?? 0).toBe(0);
  });

  it('separates counts by gw', () => {
    const fixtures = [makeFixture(1, 2, 5), makeFixture(1, 3, 6)];
    const map = computeFixturesByTeamGw(fixtures);
    expect(map.get(1)?.get(5)).toBe(1);
    expect(map.get(1)?.get(6)).toBe(1);
  });
});

// ─── resolvePlayerXPts ──────────────────────────────────────────────────────

describe('resolvePlayerXPts', () => {
  it('returns xPts from predMap when available', () => {
    const predMap = new Map([[42, new Map([[5, 7.5]])]]);
    expect(resolvePlayerXPts(42, 5, predMap, 5.0, 2)).toBe(7.5);
  });

  it('falls back to FDR approximation when no prediction', () => {
    const predMap = new Map<number, Map<number, number>>();
    // fdr=3: 1 - (2/4)*0.3 = 0.85 → 5.0 * 0.85 = 4.25
    const result = resolvePlayerXPts(99, 10, predMap, 5.0, 3);
    expect(result).toBeCloseTo(4.25, 2);
  });

  it('handles fdr=1 (easiest)', () => {
    const predMap = new Map<number, Map<number, number>>();
    const result = resolvePlayerXPts(99, 10, predMap, 6.0, 1);
    expect(result).toBeCloseTo(6.0, 2);
  });

  it('handles fdr=5 (hardest)', () => {
    const predMap = new Map<number, Map<number, number>>();
    // fdr=5: 1 - (4/4)*0.3 = 0.7 → 6.0 * 0.7 = 4.2
    const result = resolvePlayerXPts(99, 10, predMap, 6.0, 5);
    expect(result).toBeCloseTo(4.2, 2);
  });
});

// ─── chip value functions ────────────────────────────────────────────────────

const DGW_GW = 10;
const NORMAL_GW = 11;

function makePick(fplCode: number, teamId: number, isBench: boolean, avgPts = 5): SquadPick {
  return { elementId: fplCode, fplCode, teamId, isBench, seasonAvgPts: avgPts };
}

const benchPicks: SquadPick[] = [
  makePick(1, 1, true, 4),
  makePick(2, 2, true, 3),
  makePick(3, 3, true, 5),
  makePick(4, 4, true, 2),
];

const starterPicks: SquadPick[] = [
  makePick(10, 10, false, 8),
  makePick(11, 11, false, 6),
];

const predMap = new Map([
  [1, new Map([[DGW_GW, 5.0]])],
  [2, new Map([[DGW_GW, 3.5]])],
  [3, new Map([[DGW_GW, 6.0]])],
  [4, new Map([[DGW_GW, 2.0]])],
  [10, new Map([[DGW_GW, 9.0], [NORMAL_GW, 7.0]])],
  [11, new Map([[DGW_GW, 5.0], [NORMAL_GW, 5.0]])],
]);

const fixtureCount = new Map([
  [1, new Map([[DGW_GW, 2], [NORMAL_GW, 1]])],
  [2, new Map([[DGW_GW, 2], [NORMAL_GW, 1]])],
  [3, new Map([[DGW_GW, 2], [NORMAL_GW, 1]])],
  [4, new Map([[DGW_GW, 2], [NORMAL_GW, 1]])],
  [10, new Map([[DGW_GW, 2], [NORMAL_GW, 1]])],
  [11, new Map([[DGW_GW, 1], [NORMAL_GW, 1]])],
]);

const teamFdr = new Map<number, TeamFdrEntry>([
  [1, { home: 2, away: 3 }],
  [2, { home: 2, away: 3 }],
  [3, { home: 2, away: 3 }],
  [4, { home: 2, away: 3 }],
  [10, { home: 1, away: 2 }],
  [11, { home: 3, away: 4 }],
]);

describe('computeBbValue', () => {
  it('sums bench xPts with DGW multiplier in DGW', () => {
    const allPicks = [...starterPicks, ...benchPicks];
    const value = computeBbValue(DGW_GW, allPicks, predMap, fixtureCount, teamFdr);
    // bench sum = 5+3.5+6+2 = 16.5, DGW multiplier = 1.8
    expect(value).toBeCloseTo(16.5 * 1.8, 1);
  });

  it('no DGW multiplier in normal GW', () => {
    const allPicks = [...starterPicks, ...benchPicks];
    const dgwValue = computeBbValue(DGW_GW, allPicks, predMap, fixtureCount, teamFdr);
    const normalValue = computeBbValue(NORMAL_GW, allPicks, predMap, fixtureCount, teamFdr);
    expect(normalValue).toBeGreaterThan(0);
    expect(normalValue).toBeLessThan(dgwValue);
  });
});

describe('computeTcValue', () => {
  it('picks the starter with highest xPts with DGW multiplier', () => {
    const value = computeTcValue(DGW_GW, starterPicks, predMap, fixtureCount, teamFdr);
    // player 10: xPts=9.0, DGW → 9.0 * 1.8 = 16.2
    expect(value).toBeCloseTo(16.2, 1);
  });

  it('no DGW multiplier when captain has only 1 fixture', () => {
    const value = computeTcValue(NORMAL_GW, starterPicks, predMap, fixtureCount, teamFdr);
    // player 10: xPts=7.0, no DGW → 7.0
    expect(value).toBeCloseTo(7.0, 1);
  });
});

describe('computeFhValue', () => {
  it('returns higher value when more starters blank', () => {
    const blankFixtures = new Map([
      [10, new Map([[DGW_GW, 0]])],
      [11, new Map([[DGW_GW, 0]])],
    ]);
    const value = computeFhValue(DGW_GW, starterPicks, blankFixtures);
    // coverage=0, blanking=2 → bgwBonus=2.0, value=(1-0)*2*1=2
    expect(value).toBeCloseTo(2.0, 2);
  });

  it('returns low value when all starters have a fixture', () => {
    const value = computeFhValue(NORMAL_GW, starterPicks, fixtureCount);
    // coverage=1.0 → value=0
    expect(value).toBeCloseTo(0, 2);
  });

  it('applies bgwBonus=2.0 when ≥2 starters blank', () => {
    const blankFixtures = new Map([
      [10, new Map([[5, 0]])],
      [11, new Map([[5, 0]])],
    ]);
    const picks = [makePick(10, 10, false), makePick(11, 11, false)];
    const value = computeFhValue(5, picks, blankFixtures);
    expect(value).toBeCloseTo(2.0, 2);
  });
});

describe('computeWcValue', () => {
  it('returns higher value for harder fixture run', () => {
    const hardFdr = new Map<number, TeamFdrEntry>([
      [10, { home: 5, away: 5 }],
      [11, { home: 5, away: 5 }],
    ]);
    const easyFdr = new Map<number, TeamFdrEntry>([
      [10, { home: 1, away: 1 }],
      [11, { home: 1, away: 1 }],
    ]);
    const fixtures = new Map([
      [10, new Map([[5, 1], [6, 1], [7, 1], [8, 1]])],
      [11, new Map([[5, 1], [6, 1], [7, 1], [8, 1]])],
    ]);
    const hardValue = computeWcValue(5, starterPicks, hardFdr, fixtures, 4);
    const easyValue = computeWcValue(5, starterPicks, easyFdr, fixtures, 4);
    expect(hardValue).toBeGreaterThan(easyValue);
  });
});

// ─── assignChips ─────────────────────────────────────────────────────────────

describe('assignChips', () => {
  it('assigns each chip to its highest-value GW maximising total', () => {
    const chips: Array<Exclude<ActiveChip, null>> = ['bboost', '3xc'];
    const values: Record<string, Map<number, number>> = {
      bboost: new Map([[5, 10], [6, 6]]),
      '3xc': new Map([[5, 9], [6, 8]]),
    };
    const result = assignChips(chips, values);
    // Optimal: bboost=5(10) + 3xc=6(8) = 18 > bboost=6(6)+3xc=5(9)=15
    expect(result.bboost).toBe(5);
    expect(result['3xc']).toBe(6);
  });

  it('allows same GW when fewer GWs than chips (relaxed)', () => {
    const chips: Array<Exclude<ActiveChip, null>> = ['wildcard', 'freehit', 'bboost', '3xc'];
    const values: Record<string, Map<number, number>> = {
      wildcard: new Map([[19, 5.0]]),
      freehit: new Map([[19, 4.0]]),
      bboost: new Map([[19, 3.0]]),
      '3xc': new Map([[19, 2.0]]),
    };
    const result = assignChips(chips, values);
    expect(result.wildcard).toBe(19);
    expect(result.freehit).toBe(19);
    expect(result.bboost).toBe(19);
    expect(result['3xc']).toBe(19);
  });
});

// ─── buildRationale ──────────────────────────────────────────────────────────

describe('buildRationale', () => {
  it('WC rationale mentions avg FDR and GW range', () => {
    const text = buildRationale('wildcard', { gwFrom: 12, gwTo: 15, avgFdr: 4.2 });
    expect(text).toContain('4.2');
    expect(text).toContain('GW12');
    expect(text).toContain('GW15');
  });

  it('BB DGW rationale mentions player count and DGW', () => {
    const text = buildRationale('bboost', {
      dgw: true, playersWithFixture: 12, totalPlayers: 15,
      topBenchPlayers: ['Mbeumo', 'Wissa'],
    });
    expect(text).toContain('12/15');
    expect(text).toContain('DGW');
    expect(text).toContain('Mbeumo');
  });

  it('TC rationale names the captain and fixture', () => {
    const text = buildRationale('3xc', {
      playerName: 'Haaland', fixture: 'SOU (H)', fdr: 1, xPts: 14.2,
    });
    expect(text).toContain('Haaland');
    expect(text).toContain('SOU');
    expect(text).toContain('14.2');
  });

  it('FH BGW rationale mentions blanking count', () => {
    const text = buildRationale('freehit', { bgw: true, blankingCount: 5 });
    expect(text).toContain('5');
  });
});

// ─── buildMetrics ────────────────────────────────────────────────────────────

describe('buildMetrics', () => {
  it('returns 3 metrics for BB', () => {
    const metrics = buildMetrics('bboost', {
      playersWithFixture: 15, totalPlayers: 15,
      benchXPts: 20.4, dgw: true, approximated: false,
    });
    expect(metrics).toHaveLength(3);
    expect(metrics[0].label).toBeTruthy();
    expect(metrics[0].value).toBeTruthy();
  });

  it('returns 3 metrics for WC', () => {
    const metrics = buildMetrics('wildcard', {
      avgFdr: 4.1, runLength: 4, xPtsLoss: 22, approximated: false,
    });
    expect(metrics).toHaveLength(3);
  });
});

// ─── computeChipStrategy (integration) ──────────────────────────────────────

function makeBootstrap() {
  return {
    chips: [
      { name: 'wildcard', start_event: 1, stop_event: 19 },
      { name: 'freehit', start_event: 1, stop_event: 19 },
      { name: 'bboost', start_event: 1, stop_event: 19 },
      { name: '3xc', start_event: 1, stop_event: 19 },
    ],
    events: Array.from({ length: 19 }, (_, i) => ({
      id: i + 1,
      name: `Gameweek ${i + 1}`,
      finished: i < 5,
      is_current: i === 5,
      is_next: i === 6,
    })),
    teams: [
      {
        id: 1, short_name: 'ARS',
        strength_overall_home: 1600, strength_overall_away: 1500,
        strength_attack_home: 1500, strength_attack_away: 1400,
        strength_defence_home: 1600, strength_defence_away: 1550,
      },
    ],
    elements: [
      { id: 101, code: 101, team: 1, element_type: 4, total_points: 80, now_cost: 120,
        web_name: 'Striker', status: 'a' },
    ],
  };
}

function makeSquadPicks() {
  return {
    picks: Array.from({ length: 15 }, (_, i) => ({
      element: 101,
      position: i + 1,
      multiplier: i < 11 ? 1 : 0,
      is_captain: i === 0,
      is_vice_captain: i === 1,
      selling_price: 120,
    })),
    entry_history: { bank: 0, value: 1000, event: 6, points: 50,
      total_points: 400, rank: 100000, overall_rank: 200000,
      event_transfers: 1, event_transfers_cost: 0, points_on_bench: 5 },
    active_chip: null,
  };
}

describe('computeChipStrategy', () => {
  it('returns 4 chip recommendations', async () => {
    const result = await computeChipStrategy({
      bootstrap: makeBootstrap() as unknown as FPLBootstrapStatic,
      picks: makeSquadPicks() as unknown as FPLPicks,
      history: { chips: [], current: [], past: [] } as unknown as FPLHistory,
      fixtures: [],
      currentGw: 6,
      predMap: new Map(),
    });
    expect(result).toHaveLength(4);
    const chips = result.map((r) => r.chip);
    expect(chips).toContain('wildcard');
    expect(chips).toContain('freehit');
    expect(chips).toContain('bboost');
    expect(chips).toContain('3xc');
  });

  it('marks already-played chip as used', async () => {
    const result = await computeChipStrategy({
      bootstrap: makeBootstrap() as unknown as FPLBootstrapStatic,
      picks: makeSquadPicks() as unknown as FPLPicks,
      history: { chips: [{ name: 'bboost', event: 3, time: '' }], current: [], past: [] } as unknown as FPLHistory,
      fixtures: [],
      currentGw: 6,
      predMap: new Map(),
    });
    const bb = result.find((r) => r.chip === 'bboost');
    expect(bb?.status).toBe('used');
    expect(bb?.usedInGw).toBe(3);
  });

  it('all chips have metrics and rationale when recommended', async () => {
    const result = await computeChipStrategy({
      bootstrap: makeBootstrap() as unknown as FPLBootstrapStatic,
      picks: makeSquadPicks() as unknown as FPLPicks,
      history: { chips: [], current: [], past: [] } as unknown as FPLHistory,
      fixtures: [],
      currentGw: 6,
      predMap: new Map(),
    });
    for (const r of result) {
      if (r.status === 'recommended') {
        expect(r.metrics).toHaveLength(3);
        expect(r.rationale.length).toBeGreaterThan(0);
      }
    }
  });
});
