import { describe, expect, it } from 'vitest';

import { scoreGameweekFacts } from './player-layer';
import { fitTeamPoisson } from './team-poisson';
import type { EplMatchRow, PlayerGwFactRow } from './types';

const SAMPLE_MATCHES: EplMatchRow[] = [
  {
    season: '2024-25',
    matchDate: '2024-08-16',
    homeSlug: 'arsenal',
    awaySlug: 'wolves',
    fthg: 2,
    ftag: 0,
    ftr: 'H',
  },
  {
    season: '2024-25',
    matchDate: '2024-08-17',
    homeSlug: 'liverpool',
    awaySlug: 'bournemouth',
    fthg: 2,
    ftag: 1,
    ftr: 'H',
  },
];

function fact(
  overrides: Partial<PlayerGwFactRow> & Pick<PlayerGwFactRow, 'round' | 'element'>,
): PlayerGwFactRow {
  return {
    season: '2024-25',
    fixture: 1,
    teamId: 1,
    position: 'DEF',
    minutes: 90,
    starts: 1,
    goals: 0,
    assists: 0,
    totalPoints: 2,
    xp: 3,
    expectedGoals: 0.02,
    expectedAssists: 0.01,
    opponentTeam: 2,
    wasHome: true,
    ...overrides,
  };
}

describe('scoreGameweekFacts', () => {
  it('uses squad-wide team xG totals so defender xGoals stay realistic', () => {
    const trainRounds = [1, 2, 3, 4, 5];
    const facts: PlayerGwFactRow[] = [];

    for (const round of trainRounds) {
      facts.push(
        fact({
          round,
          element: 10,
          position: 'DEF',
          expectedGoals: 0.02,
          expectedAssists: 0.01,
        }),
        fact({
          round,
          element: 11,
          position: 'FWD',
          expectedGoals: 0.55,
          expectedAssists: 0.08,
        }),
      );
    }

    facts.push(
      fact({
        round: 6,
        element: 10,
        position: 'DEF',
        expectedGoals: 0,
        expectedAssists: 0,
        xp: 4,
      }),
      fact({
        round: 6,
        element: 11,
        position: 'FWD',
        expectedGoals: 0,
        expectedAssists: 0,
        xp: 6,
      }),
    );

    const fit = fitTeamPoisson(SAMPLE_MATCHES);
    const idToSlug = new Map([
      [1, 'arsenal'],
      [2, 'wolves'],
    ]);

    const preds = scoreGameweekFacts(facts, fit, idToSlug, 6, 5);
    const defender = preds.find((p) => p.seasonElementId === 10);
    const forward = preds.find((p) => p.seasonElementId === 11);

    expect(defender).toBeDefined();
    expect(forward).toBeDefined();
    expect(defender!.xGoals).toBeLessThan(0.25);
    expect(defender!.xAssists).toBeLessThan(0.2);
    expect(forward!.xGoals).toBeGreaterThan(defender!.xGoals);
  });

  it('ranks creative mids above poacher forwards on xAssists but not necessarily on xGoals', () => {
    const trainRounds = [1, 2, 3, 4, 5];
    const facts: PlayerGwFactRow[] = [];

    for (const round of trainRounds) {
      facts.push(
        fact({
          round,
          element: 20,
          position: 'FWD',
          expectedGoals: 0.65,
          expectedAssists: 0.04,
        }),
        fact({
          round,
          element: 21,
          position: 'MID',
          expectedGoals: 0.08,
          expectedAssists: 0.42,
        }),
      );
    }

    facts.push(
      fact({
        round: 6,
        element: 20,
        position: 'FWD',
        expectedGoals: 0,
        expectedAssists: 0,
        xp: 6,
      }),
      fact({
        round: 6,
        element: 21,
        position: 'MID',
        expectedGoals: 0,
        expectedAssists: 0,
        xp: 5,
      }),
    );

    const fit = fitTeamPoisson(SAMPLE_MATCHES);
    const idToSlug = new Map([
      [1, 'arsenal'],
      [2, 'wolves'],
    ]);

    const preds = scoreGameweekFacts(facts, fit, idToSlug, 6, 5);
    const forward = preds.find((p) => p.seasonElementId === 20);
    const playmaker = preds.find((p) => p.seasonElementId === 21);

    expect(forward).toBeDefined();
    expect(playmaker).toBeDefined();
    expect(forward!.xGoals).toBeGreaterThan(playmaker!.xGoals);
    expect(playmaker!.xAssists).toBeGreaterThan(forward!.xAssists);
    expect(playmaker!.xPts).not.toBeCloseTo(playmaker!.xAssists, 1);
  });
});
