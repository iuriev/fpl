import { and, count, eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { auth } from './auth/auth';
import { type AuthVars, requireUser } from './auth/middleware';
import { db } from './db/client';
import { playerWatchlistEntry, user, watchlistEntry } from './db/schema';
import * as entryService from './entry-service';

const FREE_LIMIT = 2;

const isDev = process.env.NODE_ENV !== 'production';

const me = new Hono<AuthVars>();

me.get('/', requireUser, (c) => {
  const u = c.var.user;
  if (isDev) console.log('[me] GET /api/me — id:', u.id, 'email:', u.email, 'emailVerified:', u.emailVerified, 'fplTeamId:', u.fplTeamId);
  return c.json({
    id: u.id,
    email: u.email,
    name: u.name,
    fplTeamId: u.fplTeamId ?? null,
    emailVerified: u.emailVerified,
  });
});

me.put('/team', requireUser, async (c) => {
  const body = await c.req.json<{ teamId: unknown }>();
  const teamId = Number(body?.teamId);
  if (!Number.isInteger(teamId) || teamId <= 0) {
    return c.json({ error: 'Invalid team ID' }, 400);
  }

  if (isDev) console.log('[me] PUT /api/me/team — user:', c.var.user.email, 'teamId:', teamId);

  try {
    await entryService.getEntry(teamId);
  } catch {
    if (isDev) console.log('[me] team not found:', teamId);
    return c.json({ error: 'Team not found' }, 400);
  }

  await db.update(user).set({ fplTeamId: teamId }).where(eq(user.id, c.var.user.id));
  if (isDev) console.log('[me] fplTeamId saved:', teamId, 'for user:', c.var.user.email);

  return c.json({ fplTeamId: teamId });
});

me.get('/managers-watchlist', requireUser, async (c) => {
  const rows = await db
    .select({ teamId: watchlistEntry.teamId })
    .from(watchlistEntry)
    .where(eq(watchlistEntry.userId, c.var.user.id))
    .orderBy(watchlistEntry.createdAt);
  const managers = await Promise.all(rows.map((r) => entryService.getEntry(r.teamId)));
  return c.json({ managers });
});

me.post('/managers-watchlist', requireUser, async (c) => {
  const body = await c.req.json<{ teamId: unknown }>();
  const teamId = Number(body?.teamId);
  if (!Number.isInteger(teamId) || teamId <= 0) {
    return c.json({ error: 'Invalid team ID' }, 400);
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(watchlistEntry)
    .where(eq(watchlistEntry.userId, c.var.user.id));
  if (total >= FREE_LIMIT) {
    return c.json({ error: 'limit' }, 409);
  }

  try {
    await db.insert(watchlistEntry).values({
      id: crypto.randomUUID(),
      userId: c.var.user.id,
      teamId,
    });
  } catch {
    return c.json({ error: 'duplicate' }, 409);
  }

  return c.json({ teamId });
});

me.delete('/managers-watchlist/:teamId', requireUser, async (c) => {
  const teamId = Number(c.req.param('teamId'));
  if (!Number.isInteger(teamId) || teamId <= 0) {
    return c.json({ error: 'Invalid team ID' }, 400);
  }
  await db
    .delete(watchlistEntry)
    .where(and(eq(watchlistEntry.userId, c.var.user.id), eq(watchlistEntry.teamId, teamId)));
  return new Response(null, { status: 204 });
});

me.get('/player-watchlist', requireUser, async (c) => {
  const rows = await db
    .select({ playerId: playerWatchlistEntry.playerId })
    .from(playerWatchlistEntry)
    .where(eq(playerWatchlistEntry.userId, c.var.user.id))
    .orderBy(playerWatchlistEntry.createdAt);
  return c.json({ playerIds: rows.map((r) => r.playerId) });
});

me.post('/player-watchlist', requireUser, async (c) => {
  const body = await c.req.json<{ playerId: unknown }>();
  const playerId = Number(body?.playerId);
  if (!Number.isInteger(playerId) || playerId <= 0) {
    return c.json({ error: 'Invalid player ID' }, 400);
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(playerWatchlistEntry)
    .where(eq(playerWatchlistEntry.userId, c.var.user.id));
  if (total >= FREE_LIMIT) {
    return c.json({ error: 'limit' }, 409);
  }

  try {
    await db.insert(playerWatchlistEntry).values({
      id: crypto.randomUUID(),
      userId: c.var.user.id,
      playerId,
    });
  } catch {
    return c.json({ error: 'duplicate' }, 409);
  }

  return c.json({ playerId });
});

me.delete('/player-watchlist/:playerId', requireUser, async (c) => {
  const playerId = Number(c.req.param('playerId'));
  if (!Number.isInteger(playerId) || playerId <= 0) {
    return c.json({ error: 'Invalid player ID' }, 400);
  }
  await db
    .delete(playerWatchlistEntry)
    .where(
      and(
        eq(playerWatchlistEntry.userId, c.var.user.id),
        eq(playerWatchlistEntry.playerId, playerId),
      ),
    );
  return new Response(null, { status: 204 });
});

me.post('/logout', async (c) => {
  return auth.handler(c.req.raw);
});

export { me };
