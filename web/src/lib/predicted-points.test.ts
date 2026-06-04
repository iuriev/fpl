import { describe, expect, it } from 'vitest';

import { buildPredictedPointsRows, formatCsProb } from '@/lib/predicted-points';
import type { PoolPlayer, PredictionsResponse } from '@/types';

function makePlayer(id: number, code: number, expectedPoints: string): PoolPlayer {
  return {
    id,
    code,
    webName: `P${id}`,
    firstName: 'A',
    lastName: 'B',
    team: 1,
    teamCode: 3,
    teamShortName: 'ARS',
    position: 'MID',
    nowCost: 80,
    totalPoints: 0,
    eventPoints: 0,
    status: 'a',
    chanceOfPlaying: null,
    news: '',
    selectedByPercent: '0',
    expectedPoints,
    form: '0',
    nextFixtures: [],
  };
}

describe('buildPredictedPointsRows', () => {
  it('sorts by model xPts when predictions are ready', () => {
    const players = [
      makePlayer(1, 10001, '9.0'),
      makePlayer(2, 10002, '5.0'),
    ];
    const predictions: PredictionsResponse = {
      event: 34,
      modelRunId: 'run',
      ready: true,
      players: [
        {
          fplCode: 10001,
          playerId: 1,
          event: 34,
          xPts: 4.0,
          xGoals: 0.1,
          xAssists: 0.1,
          csProb: null,
          defconPts: 0,
          confidence: 'medium',
          epNextAnchor: 9,
          modelXPts: 3,
        },
        {
          fplCode: 10002,
          playerId: 2,
          event: 34,
          xPts: 8.0,
          xGoals: 0.5,
          xAssists: 0.2,
          csProb: null,
          defconPts: 0.1,
          confidence: 'high',
          epNextAnchor: 5,
          modelXPts: 8,
        },
      ],
    };
    const rows = buildPredictedPointsRows(players, predictions);
    expect(rows[0].player.id).toBe(2);
    expect(rows[0].xPts).toBe(8);
    expect(rows[1].prediction?.fplCode).toBe(10001);
  });

  it('does not attach prediction when fpl code mismatches element id', () => {
    const players = [makePlayer(395, 99999, '5.0')];
    const predictions: PredictionsResponse = {
      event: 38,
      modelRunId: 'run',
      ready: true,
      players: [
        {
          fplCode: 88888,
          playerId: 395,
          event: 38,
          xPts: 15,
          xGoals: 1.8,
          xAssists: 1.6,
          csProb: 0.29,
          defconPts: 0.2,
          confidence: 'high',
          epNextAnchor: 1,
          modelXPts: 16,
        },
      ],
    };
    const rows = buildPredictedPointsRows(players, predictions);
    expect(rows[0].prediction).toBeUndefined();
    expect(rows[0].xPts).toBe(5);
  });

  it('falls back to FPL expectedPoints when model not ready', () => {
    const players = [makePlayer(1, 10001, '3.0'), makePlayer(2, 10002, '7.0')];
    const rows = buildPredictedPointsRows(players, {
      event: 34,
      modelRunId: null,
      ready: false,
      players: [],
    });
    expect(rows[0].player.id).toBe(2);
    expect(rows[0].prediction).toBeUndefined();
  });
});

describe('formatCsProb', () => {
  it('returns em dash for null', () => {
    expect(formatCsProb(null)).toBe('—');
  });

  it('formats probability as percent', () => {
    expect(formatCsProb(0.324)).toBe('32%');
  });
});
