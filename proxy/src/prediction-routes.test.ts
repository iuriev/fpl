import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./auth/auth', () => ({
  auth: { api: { getSession: vi.fn() }, handler: vi.fn() },
}));

vi.mock('./db/client', () => ({
  db: { select: vi.fn() },
}));

vi.mock('./prediction-service', () => ({
  getPredictionsForEvent: vi.fn(async (event: number) => ({
    event,
    modelRunId: 'run-1',
    ready: true,
    players: [{ fplCode: 12345, playerId: 1, event, xPts: 5.5, xGoals: 0.4, xAssists: 0.1, csProb: null, defconPts: 0.2, confidence: 'medium', epNextAnchor: 5.0, modelXPts: 5.8 }],
  })),
  getPredictionsPreviewForEvent: vi.fn(async (event: number) => ({
    event,
    modelRunId: 'run-1',
    ready: true,
    byXPts: { FWD: [], MID: [], DEF: [], GK: [] },
    byXAssists: { FWD: [], MID: [], DEF: [] },
  })),
}));

import { auth } from './auth/auth';
import { db } from './db/client';
import { predictionRoutes } from './prediction-routes';
import * as predictionService from './prediction-service';

const app = new Hono().route('/api', predictionRoutes);

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

describe('GET /api/predictions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const res = await app.request('/api/predictions?event=34');
    expect(res.status).toBe(401);
  });

  it('returns 403 for free tier', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDbUser('free');
    const res = await app.request('/api/predictions?event=34', {
      headers: { cookie: 'session=1' },
    });
    expect(res.status).toBe(403);
    expect(predictionService.getPredictionsForEvent).not.toHaveBeenCalled();
  });

  it('returns 200 for premium tier', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDbUser('premium');
    const res = await app.request('/api/predictions?event=34', {
      headers: { cookie: 'session=1' },
    });
    expect(res.status).toBe(200);
    expect(predictionService.getPredictionsForEvent).toHaveBeenCalledWith(34);
  });

  it('rejects invalid event', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDbUser('premium');
    const res = await app.request('/api/predictions?event=99', {
      headers: { cookie: 'session=1' },
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/predictions/preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const res = await app.request('/api/predictions/preview?event=34');
    expect(res.status).toBe(401);
  });

  it('returns preview for free tier', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    mockDbUser('free');
    const res = await app.request('/api/predictions/preview?event=34', {
      headers: { cookie: 'session=1' },
    });
    expect(res.status).toBe(200);
    expect(predictionService.getPredictionsPreviewForEvent).toHaveBeenCalledWith(34);
    expect(predictionService.getPredictionsForEvent).not.toHaveBeenCalled();
  });
});
