import { createMiddleware } from 'hono/factory';

import { auth, type AuthUser } from './auth';

export type AuthVars = { Variables: { user: AuthUser } };

const isDev = process.env.NODE_ENV !== 'production';

export const requireUser = createMiddleware<AuthVars>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    if (isDev) console.log('[auth] no session →', c.req.method, c.req.path);
    return c.json({ error: 'Unauthorized' }, 401);
  }
  if (isDev) console.log('[auth] session ok — user:', session.user.email, 'emailVerified:', session.user.emailVerified);
  c.set('user', session.user);
  await next();
});
