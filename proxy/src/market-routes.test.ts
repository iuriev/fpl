import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { auth } from './auth/auth';
import { db } from './db/client';
import { marketRoutes } from './market-routes';
import * as marketService from './market-service';
import type { MarketResponse } from './prediction/types';

vi.mock('./auth/auth', () => ({
  auth: { api: { getSession: vi.fn() }, handler: vi.fn() },
}));

vi.mock('./db/client', () => ({
  db: { select: vi.fn() },
}));

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
  getMarketPreviewForEvent: vi.fn(async (event: number) => ({
    event,
    modelRunId: 'run-1',
    ready: true,
    topCs: [
      {
        teamId: 1,
        teamCode: 3,
        teamName: 'Arsenal',
        teamShortName: 'ARS',
        fixtures: [],
        csProb: 0.42,
        xG: 1.8,
        xGA: 0.9,
      },
    ],
    topXg: [
      {
        teamId: 2,
        teamCode: 4,
        teamName: 'Liverpool',
        teamShortName: 'LIV',
        fixtures: [],
        csProb: 0.2,
        xG: 2.1,
        xGA: 0.8,
      },
    ],
  })),
}));

const app = new Hono().route('/api', marketRoutes);

const mockSession = {
  user: {
    id: 'u1',
    email: 'test@example.com',
    name: 'Test',
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  session: {} as never,
};

function mockDbUser(tier: 'free' | 'premium') {
  vi.mocked(db.select).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          { subscriptionTier: tier, fplTeamId: 72828, email: 'test@example.com' },
        ]),
      }),
    }),
  } as never);
}

describe('GET /api/market', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const res = await app.request('/api/market?event=34');
    expect(res.status).toBe(401);
  });

  it('returns 403 for free tier', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDbUser('free');
    const res = await app.request('/api/market?event=34', {
      headers: { cookie: 'session=1' },
    });
    expect(res.status).toBe(403);
    expect(marketService.getMarketForEvent).not.toHaveBeenCalled();
  });

  it('returns market data for premium tier', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDbUser('premium');
    const res = await app.request('/api/market?event=34', {
      headers: { cookie: 'session=1' },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as MarketResponse;
    expect(body.ready).toBe(true);
    expect(body.teams).toHaveLength(1);
    expect(marketService.getMarketForEvent).toHaveBeenCalledWith(34);
  });

  it('rejects invalid event', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDbUser('premium');
    const res = await app.request('/api/market?event=99', {
      headers: { cookie: 'session=1' },
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/market/preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns preview for free tier', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDbUser('free');
    const res = await app.request('/api/market/preview?event=34', {
      headers: { cookie: 'session=1' },
    });
    expect(res.status).toBe(200);
    expect(marketService.getMarketPreviewForEvent).toHaveBeenCalledWith(34);
    expect(marketService.getMarketForEvent).not.toHaveBeenCalled();
  });
});
