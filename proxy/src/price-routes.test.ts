import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./auth/auth', () => ({
  auth: { api: { getSession: vi.fn() }, handler: vi.fn() },
}));

vi.mock('./db/client', () => ({
  db: { select: vi.fn() },
}));

vi.mock('./price-changes-service', () => ({
  getPriceChanges: vi.fn(),
  getPriceChangesForSquad: vi.fn(),
}));

vi.mock('./price-predictions-service', () => ({
  getPricePredictions: vi.fn(),
  getPricePredictionsForSquad: vi.fn(),
}));

vi.mock('./squad-player-ids', () => ({
  getSquadPlayerIds: vi.fn(),
}));

import { auth } from './auth/auth';
import { db } from './db/client';
import * as priceChangesService from './price-changes-service';
import * as pricePredictionsService from './price-predictions-service';
import { priceRoutes } from './price-routes';
import { getSquadPlayerIds } from './squad-player-ids';

const app = new Hono().route('/api', priceRoutes);

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

describe('GET /api/price-changes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(priceChangesService.getPriceChanges).mockResolvedValue({
      period: 'gw',
      direction: 'rise',
      players: [],
    });
  });

  it('returns price changes for valid query', async () => {
    const res = await app.request('/api/price-changes?period=gw&direction=rise&position=all');
    expect(res.status).toBe(200);
    expect(priceChangesService.getPriceChanges).toHaveBeenCalledWith('gw', 'rise', 'all');
  });

  it('returns 400 for invalid period', async () => {
    const res = await app.request('/api/price-changes?period=bad&direction=rise&position=all');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/price-changes/squad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSquadPlayerIds).mockResolvedValue(new Set([1, 2]));
    vi.mocked(priceChangesService.getPriceChangesForSquad).mockResolvedValue({
      period: 'gw',
      direction: 'rise',
      players: [],
    });
  });

  it('returns 401 without session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const res = await app.request('/api/price-changes/squad?period=gw&direction=rise&position=all');
    expect(res.status).toBe(401);
  });

  it('returns 403 for free tier', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    const mockLimit = vi.fn().mockResolvedValue([
      { subscriptionTier: 'free', fplTeamId: 72828, email: 'test@example.com' },
    ]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

    const res = await app.request('/api/price-changes/squad?period=gw&direction=rise&position=all');
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('premium_required');
  });

  it('returns squad list for premium user', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    const mockLimit = vi.fn().mockResolvedValue([
      { subscriptionTier: 'premium', fplTeamId: 72828, email: 'test@example.com' },
    ]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

    const res = await app.request('/api/price-changes/squad?period=gw&direction=rise&position=all');
    expect(res.status).toBe(200);
    expect(getSquadPlayerIds).toHaveBeenCalledWith(72828);
  });
});

describe('GET /api/price-predictions', () => {
  beforeEach(() => {
    vi.mocked(pricePredictionsService.getPricePredictions).mockResolvedValue({
      direction: 'rise',
      players: [],
    });
  });

  it('returns predictions', async () => {
    const res = await app.request('/api/price-predictions?direction=rise&position=MID');
    expect(res.status).toBe(200);
    expect(pricePredictionsService.getPricePredictions).toHaveBeenCalledWith('rise', 'MID');
  });
});
