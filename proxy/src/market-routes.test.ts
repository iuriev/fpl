import { describe, expect, it, vi } from 'vitest';

import { marketRoutes } from './market-routes';
import type { MarketResponse } from './prediction/types';

vi.mock('./market-service', () => ({
  getMarketForEvent: vi.fn(async (event: number) => ({
    event,
    modelRunId: 'run-1',
    ready: true,
    teams: [
      {
        teamId: 1,
        teamCode: 3,
        teamName: 'Arsenal',
        teamShortName: 'ARS',
        fixtures: [{ opponentTeamId: 2, opponentShortName: 'MCI', isHome: true }],
        csProb: 0.42,
        xG: 1.8,
        xGA: 0.9,
      },
    ],
  })),
}));

describe('GET /api/market', () => {
  it('returns market data for valid event', async () => {
    const res = await marketRoutes.request('/market?event=34');
    expect(res.status).toBe(200);
    const body = (await res.json()) as MarketResponse;
    expect(body.ready).toBe(true);
    expect(body.teams).toHaveLength(1);
    expect(body.teams[0].csProb).toBe(0.42);
    expect(body.teams[0].xG).toBe(1.8);
  });

  it('returns ready:false when no model run', async () => {
    const { getMarketForEvent } = await import('./market-service');
    vi.mocked(getMarketForEvent).mockResolvedValueOnce({
      event: 34,
      modelRunId: null,
      ready: false,
      teams: [],
    });
    const res = await marketRoutes.request('/market?event=34');
    expect(res.status).toBe(200);
    const body = (await res.json()) as MarketResponse;
    expect(body.ready).toBe(false);
    expect(body.teams).toHaveLength(0);
  });

  it('rejects invalid event', async () => {
    const res = await marketRoutes.request('/market?event=99');
    expect(res.status).toBe(400);
  });

  it('rejects missing event param', async () => {
    const res = await marketRoutes.request('/market');
    expect(res.status).toBe(400);
  });
});
