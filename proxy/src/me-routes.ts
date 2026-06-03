import { eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { auth } from './auth/auth';
import { type AuthVars, requireUser } from './auth/middleware';
import { db } from './db/client';
import { user } from './db/schema';
import * as entryService from './entry-service';

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

me.post('/logout', async (c) => {
  return auth.handler(c.req.raw);
});

export { me };
