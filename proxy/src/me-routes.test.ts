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

import { auth } from './auth/auth';
import { db } from './db/client';
import * as entryService from './entry-service';
import { me } from './me-routes';

const mockDb = vi.mocked(db);

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
});

describe('GET /api/me', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me');
    expect(res.status).toBe(401);
  });

  it('returns user profile when authenticated', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    const res = await app.request('/api/me');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      fplTeamId: 42,
      emailVerified: false,
    });
  });

  it('returns null fplTeamId when not set', async () => {
    mockGetSession.mockResolvedValue({
      user: { ...mockUser, fplTeamId: null },
      session: {} as never,
    });
    const res = await app.request('/api/me');
    const body = (await res.json()) as { fplTeamId: null };
    expect(body.fplTeamId).toBeNull();
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

function makeDeleteChain() {
  const chain = { where: vi.fn().mockResolvedValue([]) };
  mockDb.delete.mockReturnValue(chain as never);
  return chain;
}

describe('GET /api/me/watchlist', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me/watchlist');
    expect(res.status).toBe(401);
  });

  it('returns empty teamIds when no entries', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeSelectChain([]);
    const res = await app.request('/api/me/watchlist');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ teamIds: [] });
  });

  it('returns teamIds when entries exist', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeSelectChain([{ teamId: 100 }, { teamId: 200 }]);
    const res = await app.request('/api/me/watchlist');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ teamIds: [100, 200] });
  });
});

describe('POST /api/me/watchlist', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: 123 }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid teamId', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    const res = await app.request('/api/me/watchlist', {
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
    const res = await app.request('/api/me/watchlist', {
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
    const res = await app.request('/api/me/watchlist', {
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
    const res = await app.request('/api/me/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: 123 }),
    });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'duplicate' });
  });
});

describe('DELETE /api/me/watchlist/:teamId', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me/watchlist/123', { method: 'DELETE' });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid teamId', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    const res = await app.request('/api/me/watchlist/abc', { method: 'DELETE' });
    expect(res.status).toBe(400);
  });

  it('returns 204 on success', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeDeleteChain();
    const res = await app.request('/api/me/watchlist/123', { method: 'DELETE' });
    expect(res.status).toBe(204);
  });

  it('returns 204 even when entry did not exist', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeDeleteChain();
    const res = await app.request('/api/me/watchlist/9999', { method: 'DELETE' });
    expect(res.status).toBe(204);
  });
});

describe('GET /api/me/player-watchlist', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me/player-watchlist');
    expect(res.status).toBe(401);
  });

  it('returns empty playerIds when no entries', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeSelectChain([]);
    const res = await app.request('/api/me/player-watchlist');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ playerIds: [] });
  });

  it('returns playerIds when entries exist', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeSelectChain([{ playerId: 300 }, { playerId: 400 }]);
    const res = await app.request('/api/me/player-watchlist');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ playerIds: [300, 400] });
  });
});

describe('POST /api/me/player-watchlist', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me/player-watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: 300 }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid playerId', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    const res = await app.request('/api/me/player-watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: 0 }),
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
      body: JSON.stringify({ playerId: 300 }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ playerId: 300 });
  });

  it('returns 409 limit when at FREE_LIMIT', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeCountChain(2);
    const res = await app.request('/api/me/player-watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: 300 }),
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
      body: JSON.stringify({ playerId: 300 }),
    });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'duplicate' });
  });
});

describe('DELETE /api/me/player-watchlist/:playerId', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await app.request('/api/me/player-watchlist/300', { method: 'DELETE' });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid playerId', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    const res = await app.request('/api/me/player-watchlist/abc', { method: 'DELETE' });
    expect(res.status).toBe(400);
  });

  it('returns 204 on success', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeDeleteChain();
    const res = await app.request('/api/me/player-watchlist/300', { method: 'DELETE' });
    expect(res.status).toBe(204);
  });

  it('returns 204 even when entry did not exist', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser, session: {} as never });
    makeDeleteChain();
    const res = await app.request('/api/me/player-watchlist/9999', { method: 'DELETE' });
    expect(res.status).toBe(204);
  });
});
