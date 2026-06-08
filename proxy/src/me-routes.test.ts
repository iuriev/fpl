import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./auth/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  },
}));

vi.mock('./db/client', () => ({
  db: {
    update: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('./entry-service', () => ({
  getEntry: vi.fn(),
}));

vi.mock('./fpl-cache/db-cache', () => ({
  getOrFetchBootstrap: vi.fn(),
}));

vi.mock('./player-watchlist-service', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./player-watchlist-service')>();
  return {
    ...mod,
    loadWatchlistedFplCodes: vi.fn(),
    ensurePlayerWatchlistSchema: vi.fn(),
  };
});

import { auth } from './auth/auth';
import { db } from './db/client';
import * as entryService from './entry-service';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
import { me } from './me-routes';
import * as playerWatchlistService from './player-watchlist-service';

const mockDb = vi.mocked(db);
const mockGetBootstrap = vi.mocked(getOrFetchBootstrap);
const mockLoadWatchlistedFplCodes = vi.mocked(playerWatchlistService.loadWatchlistedFplCodes);

const mockGetSession = vi.mocked(auth.api.getSession);
const mockGetEntry = vi.mocked(entryService.getEntry);

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  fplTeamId: 42,
  emailVerified: false,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const app = new Hono().route('/api/me', me);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetBootstrap.mockResolvedValue({
    elements: [
      { id: 300, code: 90001 },
      { id: 400, code: 90002 },
    ],
  } as never);
  mockLoadWatchlistedFplCodes.mockResolvedValue(new Set());
});

describe('GET /api/me', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me');
    expect(res.status).toBe(401);
  });

  it('returns user profile from database, not stale session cache', async () => {
    mockGetSession.mockResolvedValue({
      user: { ...mockUser, fplTeamId: null },
      session: {} as never,
    });
    const mockLimit = vi.fn().mockResolvedValue([
      {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        fplTeamId: 42,
        emailVerified: false,
        subscriptionTier: 'free',
      },
    ]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

    const res = await app.request('/api/me');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      fplTeamId: 42,
      emailVerified: false,
      subscriptionTier: 'free',
    });
  });

  it('returns null fplTeamId when not set in database', async () => {
    mockGetSession.mockResolvedValue({
      user: { ...mockUser, fplTeamId: 99 },
      session: {} as never,
    });
    const mockLimit = vi.fn().mockResolvedValue([
      {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        fplTeamId: null,
        emailVerified: false,
        subscriptionTier: 'premium',
      },
    ]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

    const res = await app.request('/api/me');
    const body = (await res.json()) as { fplTeamId: null; subscriptionTier: string };
    expect(body.fplTeamId).toBeNull();
  });

  it('returns premium when PREMIUM_OVERRIDE_EMAIL matches', async () => {
    const prev = process.env.PREMIUM_OVERRIDE_EMAIL;
    process.env.PREMIUM_OVERRIDE_EMAIL = 'vip@test.com';
    try {
      mockGetSession.mockResolvedValue({
        user: { ...mockUser, email: 'vip@test.com' },
        session: {} as never,
      });
      const mockLimit = vi.fn().mockResolvedValue([
        {
          id: 'user-1',
          email: 'vip@test.com',
          name: 'Test User',
          fplTeamId: 42,
          emailVerified: false,
          subscriptionTier: 'free',
        },
      ]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const res = await app.request('/api/me');
      const body = (await res.json()) as { subscriptionTier: string };
      expect(body.subscriptionTier).toBe('premium');
    } finally {
      if (prev === undefined) delete process.env.PREMIUM_OVERRIDE_EMAIL;
      else process.env.PREMIUM_OVERRIDE_EMAIL = prev;
    }
  });
});

describe('PUT /api/me/team', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me/team', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: 123 }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid team ID', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    const res = await app.request('/api/me/team', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: -1 }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when team not found in FPL API', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    mockGetEntry.mockRejectedValue(new Error('404 not found'));
    const res = await app.request('/api/me/team', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: 9999999 }),
    });
    expect(res.status).toBe(400);
  });

  it('updates fplTeamId and returns 200 on valid team', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    mockGetEntry.mockResolvedValue({} as never);
    makeDeleteChain();
    const mockChain = { set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) };
    vi.mocked(db.update).mockReturnValue(mockChain as never);

    const res = await app.request('/api/me/team', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: 123 }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { fplTeamId: number };
    expect(body).toEqual({ fplTeamId: 123 });
    expect(mockDb.delete).toHaveBeenCalled();
  });
});

describe('anonymous /api/entry routes are unaffected', () => {
  it('me routes do not intercept /api/entry paths', () => {
    const routes = me.routes.map((r) => r.path);
    expect(routes.every((p) => !p.includes('entry'))).toBe(true);
  });
});

function makeSelectChain(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(rows),
  };
  mockDb.select.mockReturnValue(chain as never);
  return chain;
}

function makeCountChain(total: number) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{ total }]),
  };
  mockDb.select.mockReturnValue(chain as never);
  return chain;
}

function makeInsertChain(shouldThrow = false) {
  const valuesResult = shouldThrow ? Promise.reject(new Error('unique')) : Promise.resolve([]);
  const chain = { values: vi.fn().mockReturnValue(valuesResult) };
  mockDb.insert.mockReturnValue(chain as never);
  return chain;
}

function makeUpsertChain() {
  const chain = {
    values: vi.fn().mockReturnValue({
      onConflictDoUpdate: vi.fn().mockResolvedValue([]),
    }),
  };
  mockDb.insert.mockReturnValue(chain as never);
  return chain;
}

function makeSelectLimitChain(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
  mockDb.select.mockReturnValue(chain as never);
  return chain;
}

const validDraftBody = {
  teamId: 42,
  targetGw: 6,
  savedAt: '2026-06-01T12:00:00.000Z',
  freeTransfers: 1,
  chip: 'none',
  swaps: [],
  subs: [],
};

const draftRow = {
  userId: 'user-1',
  teamId: 42,
  targetGw: 6,
  savedAt: new Date('2026-06-01T12:00:00.000Z'),
  freeTransfers: 1,
  chip: 'none',
  swaps: [],
  subs: [],
  updatedAt: new Date(),
};

function makeDeleteChain() {
  const chain = { where: vi.fn().mockResolvedValue([]) };
  mockDb.delete.mockReturnValue(chain as never);
  return chain;
}

const mockEntry = {
  teamId: 100,
  teamName: 'Test FC',
  managerName: 'Test Manager',
  overallPoints: 2000,
  overallRank: 100000,
  eventPoints: 65,
  eventRank: 200000,
  totalPlayers: 10000000,
};

describe('GET /api/me/managers-watchlist', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me/managers-watchlist');
    expect(res.status).toBe(401);
  });

  it('returns empty managers when no entries', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeSelectChain([]);
    const res = await app.request('/api/me/managers-watchlist');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ managers: [] });
  });

  it('returns enriched manager data when entries exist', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeSelectChain([{ teamId: 100 }]);
    mockGetEntry.mockResolvedValue(mockEntry);
    const res = await app.request('/api/me/managers-watchlist');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { managers: unknown[] };
    expect(body.managers).toHaveLength(1);
    expect(body.managers[0]).toMatchObject({ teamId: 100, managerName: 'Test Manager' });
  });

  it('returns teamId-only stubs when FPL enrichment fails', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeSelectChain([{ teamId: 100 }, { teamId: 999999 }]);
    mockGetEntry
      .mockResolvedValueOnce(mockEntry)
      .mockRejectedValueOnce(new Error('FPL API error: 404 Not Found'));
    const res = await app.request('/api/me/managers-watchlist');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { managers: unknown[] };
    expect(body.managers).toEqual([
      mockEntry,
      { teamId: 999999 },
    ]);
  });
});

describe('POST /api/me/managers-watchlist', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me/managers-watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: 123 }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid teamId', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    const res = await app.request('/api/me/managers-watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: -1 }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 200 when added successfully', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeCountChain(0);
    makeInsertChain(false);
    const res = await app.request('/api/me/managers-watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: 123 }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ teamId: 123 });
  });

  it('returns 409 limit when at FREE_LIMIT', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeCountChain(2);
    const res = await app.request('/api/me/managers-watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: 123 }),
    });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'limit' });
  });

  it('returns 409 duplicate on constraint violation', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeCountChain(0);
    makeInsertChain(true);
    const res = await app.request('/api/me/managers-watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: 123 }),
    });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'duplicate' });
  });
});

describe('DELETE /api/me/managers-watchlist/:teamId', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me/managers-watchlist/123', { method: 'DELETE' });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid teamId', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    const res = await app.request('/api/me/managers-watchlist/abc', { method: 'DELETE' });
    expect(res.status).toBe(400);
  });

  it('returns 204 on success', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeDeleteChain();
    const res = await app.request('/api/me/managers-watchlist/123', { method: 'DELETE' });
    expect(res.status).toBe(204);
  });

  it('returns 204 even when entry did not exist', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeDeleteChain();
    const res = await app.request('/api/me/managers-watchlist/9999', { method: 'DELETE' });
    expect(res.status).toBe(204);
  });
});

describe('GET /api/me/player-watchlist', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me/player-watchlist');
    expect(res.status).toBe(401);
  });

  it('returns empty fplCodes when no entries', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    mockLoadWatchlistedFplCodes.mockResolvedValue(new Set());
    const res = await app.request('/api/me/player-watchlist');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ fplCodes: [], playerIds: [] });
  });

  it('returns fplCodes when entries exist', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    mockLoadWatchlistedFplCodes.mockResolvedValue(new Set([90001, 90002]));
    const res = await app.request('/api/me/player-watchlist');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ fplCodes: [90001, 90002], playerIds: [300, 400] });
  });
});

describe('POST /api/me/player-watchlist', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me/player-watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fplCode: 90001 }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid fplCode', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    const res = await app.request('/api/me/player-watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fplCode: 0 }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 200 when added successfully', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeCountChain(1);
    makeInsertChain(false);
    const res = await app.request('/api/me/player-watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fplCode: 90001 }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ fplCode: 90001, playerId: 300 });
  });

  it('accepts legacy playerId and stores canonical fplCode', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeCountChain(0);
    makeInsertChain(false);
    const res = await app.request('/api/me/player-watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: 300 }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ fplCode: 90001, playerId: 300 });
  });

  it('returns 409 limit when at FREE_LIMIT', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeCountChain(2);
    const res = await app.request('/api/me/player-watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fplCode: 90001 }),
    });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'limit' });
  });

  it('returns 409 duplicate on constraint violation', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeCountChain(0);
    makeInsertChain(true);
    const res = await app.request('/api/me/player-watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fplCode: 90001 }),
    });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'duplicate' });
  });
});

describe('DELETE /api/me/player-watchlist/:fplCode', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me/player-watchlist/90001', { method: 'DELETE' });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid fplCode', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    const res = await app.request('/api/me/player-watchlist/abc', { method: 'DELETE' });
    expect(res.status).toBe(400);
  });

  it('returns 204 on success', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeDeleteChain();
    const res = await app.request('/api/me/player-watchlist/90001', { method: 'DELETE' });
    expect(res.status).toBe(204);
  });

  it('returns 204 even when entry did not exist', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeDeleteChain();
    const res = await app.request('/api/me/player-watchlist/9999', { method: 'DELETE' });
    expect(res.status).toBe(204);
  });
});

describe('GET /api/me/transfer-draft', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me/transfer-draft');
    expect(res.status).toBe(401);
  });

  it('returns 404 when no draft', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeSelectLimitChain([]);
    const res = await app.request('/api/me/transfer-draft');
    expect(res.status).toBe(404);
  });

  it('returns draft when present', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeSelectLimitChain([draftRow]);
    const res = await app.request('/api/me/transfer-draft');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { teamId: number; savedAt: string };
    expect(body.teamId).toBe(42);
    expect(body.savedAt).toBe('2026-06-01T12:00:00.000Z');
  });
});

describe('PUT /api/me/transfer-draft', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me/transfer-draft', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validDraftBody),
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    const res = await app.request('/api/me/transfer-draft', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: 'bad' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when user has no linked team', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeSelectLimitChain([{ fplTeamId: null }]);
    const res = await app.request('/api/me/transfer-draft', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validDraftBody),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when teamId does not match linked team', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeSelectLimitChain([{ fplTeamId: 99 }]);
    const res = await app.request('/api/me/transfer-draft', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validDraftBody),
    });
    expect(res.status).toBe(400);
  });

  it('returns 200 and upserts on valid draft', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeSelectLimitChain([{ fplTeamId: 42 }]);
    makeUpsertChain();
    const res = await app.request('/api/me/transfer-draft', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validDraftBody),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(validDraftBody);
  });
});

describe('DELETE /api/me/transfer-draft', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me/transfer-draft', { method: 'DELETE' });
    expect(res.status).toBe(401);
  });

  it('returns 204', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeDeleteChain();
    const res = await app.request('/api/me/transfer-draft', { method: 'DELETE' });
    expect(res.status).toBe(204);
  });
});
