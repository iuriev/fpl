import { eq } from 'drizzle-orm';
import { createMiddleware } from 'hono/factory';

import type { AuthVars } from './auth/middleware';
import { db } from './db/client';
import { user } from './db/schema';
import { isPremiumTier, resolveSubscriptionTier, type SubscriptionTier } from './subscription';

export type PremiumVars = AuthVars & {
  Variables: AuthVars['Variables'] & {
    subscriptionTier: SubscriptionTier;
    fplTeamId: number;
  };
};

export const requirePremiumFplUser = createMiddleware<PremiumVars>(async (c, next) => {
  const sessionUser = c.var.user;
  const [dbUser] = await db
    .select({
      subscriptionTier: user.subscriptionTier,
      fplTeamId: user.fplTeamId,
      email: user.email,
    })
    .from(user)
    .where(eq(user.id, sessionUser.id))
    .limit(1);

  if (!dbUser) {
    return c.json({ error: 'User not found' }, 404);
  }

  const tier = resolveSubscriptionTier(dbUser.subscriptionTier, dbUser.email);
  if (!isPremiumTier(tier)) {
    return c.json({ error: 'premium_required' }, 403);
  }

  if (!dbUser.fplTeamId) {
    return c.json({ error: 'Team not linked' }, 400);
  }

  c.set('subscriptionTier', tier);
  c.set('fplTeamId', dbUser.fplTeamId);
  await next();
});
