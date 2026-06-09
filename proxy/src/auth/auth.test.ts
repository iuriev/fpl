import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { auth } from './auth';

vi.mock('./auth', () => ({
  auth: {
    handler: vi.fn(),
    api: { getSession: vi.fn() },
  },
}));

vi.mock('../db/client', () => ({
  db: {},
  runMigrations: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({ emails: { send: vi.fn() } })),
}));

const mockHandler = vi.mocked(auth.handler);

function makeApp() {
  const app = new Hono();
  app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/sign-up/email', () => {
  it('delegates to auth handler and returns signup response', async () => {
    mockHandler.mockResolvedValue(
      new Response(JSON.stringify({ user: { id: '1', email: 'user@example.com' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await makeApp().request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'secret123', name: 'User' }),
    });

    expect(mockHandler).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });
});

describe('POST /api/auth/sign-in/email', () => {
  it('delegates to auth handler on valid credentials', async () => {
    mockHandler.mockResolvedValue(
      new Response(JSON.stringify({ user: { id: '1', email: 'user@example.com' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await makeApp().request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'secret123' }),
    });

    expect(mockHandler).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });

  it('returns 401 when auth handler rejects wrong password', async () => {
    mockHandler.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await makeApp().request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'wrong' }),
    });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/sign-in/social/google', () => {
  it('invokes auth handler for OAuth initiation and follows redirect', async () => {
    mockHandler.mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { Location: 'https://accounts.google.com/o/oauth2/v2/auth?...' },
      })
    );

    const res = await makeApp().request('/api/auth/sign-in/social/google');

    expect(mockHandler).toHaveBeenCalledOnce();
    expect(res.status).toBe(302);
  });
});

describe('POST /api/auth/send-verification-email', () => {
  it('delegates to auth handler', async () => {
    mockHandler.mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await makeApp().request('/api/auth/send-verification-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' }),
    });

    expect(mockHandler).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });
});
