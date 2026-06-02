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
  },
}));

vi.mock('./entry-service', () => ({
  getEntry: vi.fn(),
}));

import { auth } from './auth/auth';
import { db } from './db/client';
import * as entryService from './entry-service';
import { me } from './me-routes';

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
