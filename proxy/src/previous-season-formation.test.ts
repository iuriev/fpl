import { describe, expect, it } from 'vitest';

import type { FPLBootstrapStatic, FPLLive } from './fpl-client';
import {
  formationFromGwLiveFixture,
  lastDataCheckedGw,
  lastFixtureIdForTeamInGwLive,
  playerStartedInLiveFixture,
  priorSeasonKey,
} from './previous-season-formation';

const elements = [
  { id: 1, team: 1, element_type: 1 },
  { id: 2, team: 1, element_type: 2 },
  { id: 3, team: 1, element_type: 2 },
  { id: 4, team: 1, element_type: 2 },
  { id: 5, team: 1, element_type: 2 },
  { id: 6, team: 1, element_type: 3 },
  { id: 7, team: 1, element_type: 3 },
  { id: 8, team: 1, element_type: 3 },
  { id: 9, team: 1, element_type: 4 },
  { id: 10, team: 1, element_type: 4 },
  { id: 11, team: 1, element_type: 4 },
] as FPLBootstrapStatic['elements'];

function liveFixture(fixtureId: number, started: boolean): FPLLive['elements'][0]['explain'][0] {
  return {
    fixture: fixtureId,
    stats: started
      ? [
          { identifier: 'starts', points: 0, value: 1 },
          { identifier: 'minutes', points: 0, value: 90 },
        ]
      : [{ identifier: 'minutes', points: 0, value: 0 }],
  };
}

function buildLiveMap(fixtureId: number): Map<number, FPLLive['elements'][0]> {
  const map = new Map<number, FPLLive['elements'][0]>();
  for (const el of elements) {
    map.set(el.id, {
      id: el.id,
      stats: {
        total_points: 2,
        minutes: 90,
        starts: 1,
        goals_scored: 0,
        assists: 0,
        clean_sheets: 0,
        goals_conceded: 0,
        own_goals: 0,
        penalties_saved: 0,
        penalties_missed: 0,
        yellow_cards: 0,
        red_cards: 0,
        saves: 0,
        bonus: 0,
        bps: 0,
      },
      explain: [liveFixture(fixtureId, true)],
    });
  }
  return map;
}

describe('previous-season-formation', () => {
  it('derives prior season key', () => {
    expect(priorSeasonKey('2025-26')).toBe('2024-25');
    expect(priorSeasonKey('invalid')).toBeNull();
  });

  it('finds last data-checked gameweek', () => {
    const bootstrap = {
      events: [
        { id: 37, finished: true, data_checked: true },
        { id: 38, finished: true, data_checked: true },
      ],
    } as FPLBootstrapStatic;
    expect(lastDataCheckedGw(bootstrap)).toBe(38);
  });

  it('detects starters from live explain', () => {
    const liveEl: FPLLive['elements'][0] = {
      id: 1,
      stats: {
        total_points: 0,
        minutes: 90,
        starts: 1,
        goals_scored: 0,
        assists: 0,
        clean_sheets: 0,
        goals_conceded: 0,
        own_goals: 0,
        penalties_saved: 0,
        penalties_missed: 0,
        yellow_cards: 0,
        red_cards: 0,
        saves: 0,
        bonus: 0,
        bps: 0,
      },
      explain: [
        {
          fixture: 10,
          stats: [{ identifier: 'minutes', points: 0, value: 75 }],
        },
      ],
    };
    expect(playerStartedInLiveFixture(liveEl, 10)).toBe(true);
    expect(playerStartedInLiveFixture(liveEl, 99)).toBe(false);
  });

  it('picks latest fixture id for DGW', () => {
    const map = new Map<number, FPLLive['elements'][0]>();
    map.set(2, {
      id: 2,
      stats: {
        total_points: 0,
        minutes: 90,
        starts: 1,
        goals_scored: 0,
        assists: 0,
        clean_sheets: 0,
        goals_conceded: 0,
        own_goals: 0,
        penalties_saved: 0,
        penalties_missed: 0,
        yellow_cards: 0,
        red_cards: 0,
        saves: 0,
        bonus: 0,
        bps: 0,
      },
      explain: [
        liveFixture(100, true),
        liveFixture(200, true),
      ],
    });
    expect(lastFixtureIdForTeamInGwLive(1, elements, map)).toBe(200);
  });

  it('infers 4-3-3 from gw live fixture', () => {
    const map = buildLiveMap(50);
    const counts = formationFromGwLiveFixture(50, 1, elements, map);
    expect(counts).toEqual({ def: 4, mid: 3, fwd: 3 });
  });
});
