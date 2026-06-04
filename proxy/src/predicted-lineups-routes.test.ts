import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./auth/auth', () => ({
  auth: { api: { getSession: vi.fn() }, handler: vi.fn() },
}));

vi.mock('./db/client', () => ({
  db: { select: vi.fn() },
}));

vi.mock('./predicted-lineup-service', () => ({
  getPredictedLineups: vi.fn(),
}));

import { auth } from './auth/auth';
import { db } from './db/client';
import * as predictedLineupService from './predicted-lineup-service';
import { predictedLineupsRoutes } from './predicted-lineups-routes';

const app = new Hono().route('/api', predictedLineupsRoutes);

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

describe('GET /api/predicted-lineups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(predictedLineupService.getPredictedLineups).mockResolvedValue({
      gameweek: 10,
      teams: [],
    });
  });

  it('returns 401 without session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const res = await app.request('/api/predicted-lineups');
    expect(res.status).toBe(401);
  });

  it('returns 403 for free tier', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            { subscriptionTier: 'free', fplTeamId: 72828, email: 'test@example.com' },
          ]),
        }),
      }),
    } as never);

    const res = await app.request('/api/predicted-lineups', {
      headers: { cookie: 'session=1' },
    });
    expect(res.status).toBe(403);
    expect(predictedLineupService.getPredictedLineups).not.toHaveBeenCalled();
  });

  it('returns 200 for premium tier', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            { subscriptionTier: 'premium', fplTeamId: 72828, email: 'test@example.com' },
          ]),
        }),
      }),
    } as never);

    const res = await app.request('/api/predicted-lineups', {
      headers: { cookie: 'session=1' },
    });
    expect(res.status).toBe(200);
    expect(predictedLineupService.getPredictedLineups).toHaveBeenCalled();
  });
});
