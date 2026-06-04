import { describe, expect, it, vi } from 'vitest';

import { predictionRoutes } from './prediction-routes';
import type { PredictionsResponse } from './types';

vi.mock('./prediction-service', () => ({
  getPredictionsForEvent: vi.fn(async (event: number) => ({
    event,
    modelRunId: 'run-1',
    ready: true,
    players: [
      {
        fplCode: 12345,
        playerId: 1,
        event,
        xPts: 5.5,
        xGoals: 0.4,
        xAssists: 0.1,
        csProb: null,
        defconPts: 0.2,
        confidence: 'medium' as const,
        epNextAnchor: 5.0,
        modelXPts: 5.8,
      },
    ],
  })),
}));

describe('GET /api/predictions', () => {
  it('returns predictions for valid event', async () => {
    const res = await predictionRoutes.request('/predictions?event=34');
    expect(res.status).toBe(200);
    const body = (await res.json()) as PredictionsResponse;
    expect(body.ready).toBe(true);
    expect(body.players).toHaveLength(1);
    expect(body.players[0].xPts).toBe(5.5);
  });

  it('rejects invalid event', async () => {
    const res = await predictionRoutes.request('/predictions?event=99');
    expect(res.status).toBe(400);
  });
});
