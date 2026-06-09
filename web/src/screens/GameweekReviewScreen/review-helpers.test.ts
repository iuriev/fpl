import { describe, expect, it } from 'vitest';

import type { PoolPlayer, SquadPlayer } from '@/types';

import {
  buildTransferPairs,
  computeWhatIfScore,
  diffSquads,
  findReviewGw,
  getPlayerPointsClass,
  getStatLabel,
} from './review-helpers';

function makePlayer(id: number, name: string, points: number): SquadPlayer {
  return {
    id,
    fplCode: id,
    name,
    points,
    position: 'MID',
    club: 'ARS',
    teamCode: 3,
    teamId: 3,
    nowCost: 80,
    isCaptain: false,
    isViceCaptain: false,
    status: 'a',
    stats: {
      minutes: 90,
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
      total_points: points,
    },
  };
}

function makePoolPlayer(id: number, eventPoints: number): PoolPlayer {
  return {
    id,
    code: id,
    eventPoints,
    webName: 'Player',
    firstName: 'A',
    lastName: 'B',
    team: 1,
    teamCode: 1,
    teamShortName: 'TST',
    position: 'MID',
    nowCost: 50,
    totalPoints: 0,
    status: 'a',
    chanceOfPlaying: null,
    news: '',
    selectedByPercent: '5.0',
    expectedPoints: '4.0',
    form: '5.0',
    nextFixtures: [],
  };
}

describe('findReviewGw', () => {
  it('returns the id of the last finished GW', () => {
    expect(
      findReviewGw([
        { id: 1, finished: true },
        { id: 2, finished: true },
        { id: 3, finished: false },
      ])
    ).toBe(2);
  });

  it('returns null when no GW is finished', () => {
    expect(findReviewGw([{ id: 1, finished: false }])).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(findReviewGw([])).toBeNull();
  });
});

describe('diffSquads', () => {
  it('identifies transferred-in and transferred-out players', () => {
    const current = [makePlayer(1, 'A', 5), makePlayer(2, 'B', 3), makePlayer(3, 'C', 8)];
    const previous = [makePlayer(1, 'A', 0), makePlayer(4, 'D', 0), makePlayer(3, 'C', 0)];
    const result = diffSquads(current, previous);
    expect(result.transferredInIds).toEqual([2]);
    expect(result.transferredOutIds).toEqual([4]);
  });

  it('returns empty arrays when squads are identical', () => {
    const players = [makePlayer(1, 'A', 5), makePlayer(2, 'B', 3)];
    const result = diffSquads(players, players);
    expect(result.transferredInIds).toHaveLength(0);
    expect(result.transferredOutIds).toHaveLength(0);
  });
});

describe('buildTransferPairs', () => {
  it('pairs in/out players with their GW points', () => {
    const current = [makePlayer(2, 'Mbappe', 8)];
    const previous = [makePlayer(4, 'Son', 0)];
    const pool = [makePoolPlayer(4, 6)];
    const pairs = buildTransferPairs(current, previous, pool, [2], [4]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].in).toEqual({ id: 2, name: 'Mbappe', gwPoints: 8 });
    expect(pairs[0].out).toEqual({ id: 4, name: 'Son', gwPoints: 6 });
  });

  it('defaults out-player gwPoints to 0 when not in pool', () => {
    const current = [makePlayer(2, 'Mbappe', 8)];
    const previous = [makePlayer(4, 'Son', 0)];
    const pairs = buildTransferPairs(current, previous, [], [2], [4]);
    expect(pairs[0].out.gwPoints).toBe(0);
  });
});

describe('computeWhatIfScore', () => {
  it('subtracts in-player points, adds out-player points, restores transfer cost', () => {
    const pairs = [
      { in: { id: 2, name: 'Mbappe', gwPoints: 8 }, out: { id: 4, name: 'Son', gwPoints: 6 } },
      {
        in: { id: 5, name: 'R.James', gwPoints: 6 },
        out: { id: 6, name: 'Trippier', gwPoints: 11 },
      },
    ];
    expect(computeWhatIfScore(68, pairs, 4)).toBe(75);
  });

  it('returns actual score unchanged when no transfers', () => {
    expect(computeWhatIfScore(68, [], 0)).toBe(68);
  });
});

describe('getPlayerPointsClass', () => {
  it.each([
    [8, 'great'],
    [12, 'great'],
    [3, 'good'],
    [7, 'good'],
    [1, 'neutral'],
    [2, 'neutral'],
    [0, 'bad'],
  ] as const)('pts=%i → %s', (pts, expected) => {
    expect(getPlayerPointsClass(pts)).toBe(expected);
  });
});

describe('getStatLabel', () => {
  const base = {
    goals_scored: 0,
    assists: 0,
    clean_sheets: 0,
    minutes: 90,
    bonus: 0,
    yellow_cards: 0,
    red_cards: 0,
  };

  it('returns "0 mins" for non-playing player', () => {
    expect(getStatLabel({ ...base, minutes: 0 })).toBe('0 mins');
  });

  it('returns "goal + assist + +3 bonus" for a goalscorer with bonus', () => {
    expect(getStatLabel({ ...base, goals_scored: 1, assists: 1, bonus: 3 })).toBe(
      'goal + assist + +3 bonus'
    );
  });

  it('returns minutes string when no notable stats', () => {
    expect(getStatLabel(base)).toBe('90 mins');
  });

  it('returns "clean sheet" for player with 60+ mins', () => {
    expect(getStatLabel({ ...base, clean_sheets: 1, minutes: 90 })).toBe('clean sheet');
  });

  it('omits clean sheet for fewer than 60 mins', () => {
    expect(getStatLabel({ ...base, clean_sheets: 1, minutes: 45 })).toBe('45 mins');
  });

  it('returns "2 goals" for a brace', () => {
    expect(getStatLabel({ ...base, goals_scored: 2 })).toBe('2 goals');
  });
});
