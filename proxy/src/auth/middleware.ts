import { createMiddleware } from 'hono/factory';

import { auth, type AuthUser } from './auth';

export type AuthVars = { Variables: { user: AuthUser } };

export const requireUser = createMiddleware<AuthVars>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  c.set('user', session.user);
  await next();
});
