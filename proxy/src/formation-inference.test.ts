import { describe, expect, it } from 'vitest';

import {
  countsFromStarters,
  formationFromFixture,
  inferFormationForTeam,
  isValidFormation,
} from './formation-inference';
import type { FPLBootstrapStatic, FPLElementSummary } from './fpl-client';

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

function starterSummary(fixtureId: number): FPLElementSummary {
  return {
    history: [
      {
        fixture: fixtureId,
        round: 1,
        opponent_team: 2,
        was_home: true,
        kickoff_time: '2026-01-01',
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
        defensive_contribution: 0,
      },
    ],
  };
}

describe('formation-inference', () => {
  it('validates 4-3-3 counts', () => {
    expect(isValidFormation({ def: 4, mid: 3, fwd: 3 })).toBe(true);
    expect(isValidFormation({ def: 4, mid: 5, fwd: 1 })).toBe(true);
    expect(isValidFormation({ def: 2, mid: 3, fwd: 3 })).toBe(false);
  });

  it('counts starters per fixture', () => {
    const summaries = new Map<number, FPLElementSummary>();
    for (const el of elements) {
      summaries.set(el.id, starterSummary(99));
    }
    const counts = formationFromFixture(99, 1, elements, (id) => summaries.get(id));
    expect(counts).toEqual({ def: 4, mid: 3, fwd: 3 });
  });

  it('defaults when no fixture history', () => {
    const bootstrap = {
      elements,
      teams: [{ id: 1, short_name: 'ARS', code: 3, name: 'Arsenal' }],
    } as unknown as FPLBootstrapStatic;
    const result = inferFormationForTeam(1, bootstrap, [], () => undefined, null);
    expect(result.source).toBe('default');
    expect(result.label).toBe('4-3-3');
  });

  it('uses previous season formation when current season has no fixtures', () => {
    const bootstrap = {
      elements,
      teams: [{ id: 1, short_name: 'ARS', code: 3, name: 'Arsenal' }],
    } as unknown as FPLBootstrapStatic;
    const result = inferFormationForTeam(
      1,
      bootstrap,
      [],
      () => undefined,
      { def: 3, mid: 4, fwd: 3 }
    );
    expect(result.source).toBe('previous_season');
    expect(result.label).toBe('3-4-3');
  });

  it('countsFromStarters rejects invalid outfield count', () => {
    expect(countsFromStarters([2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4])).toBeNull();
  });
});
