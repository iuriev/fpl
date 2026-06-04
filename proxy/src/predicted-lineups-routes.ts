import { Hono } from 'hono';

import { type AuthVars, requireUser } from './auth/middleware';
import { LineupsWarmingError } from './lineups-warming-error';
import { formatLineupsWarmupStatus, getLineupsWarmupStatus } from './lineups-warmup';
import * as predictedLineupService from './predicted-lineup-service';
import { type PremiumVars, requirePremiumFplUser } from './premium-middleware';
import { MAX_GAMEWEEK } from './types';

export const predictedLineupsRoutes = new Hono<AuthVars & PremiumVars>();

const WARMING_503_LOG_MS = 15_000;
let lastWarming503LogAt = 0;

function logLineupsWarming503(gw: number | undefined): void {
  const now = Date.now();
  if (now - lastWarming503LogAt < WARMING_503_LOG_MS) return;
  lastWarming503LogAt = now;
  const s = getLineupsWarmupStatus();
  const gwPart = gw !== undefined ? `gw=${gw}` : 'gw=next';
  console.log(
    `[lineups:warmup] GET /api/predicted-lineups ${gwPart} → 503 lineups_warming (${formatLineupsWarmupStatus(s)})`
  );
}

predictedLineupsRoutes.get(
  '/predicted-lineups',
  requireUser,
  requirePremiumFplUser,
  async (c) => {
    const gwRaw = c.req.query('gw');
    let gw: number | undefined;
    if (gwRaw !== undefined) {
      gw = parseInt(gwRaw, 10);
      if (isNaN(gw) || gw < 1 || gw > MAX_GAMEWEEK) {
        return c.json({ error: 'Invalid gameweek' }, 400);
      }
    }

    try {
      const result = await predictedLineupService.getPredictedLineups(gw);
      return c.json(result);
    } catch (error) {
      if (error instanceof LineupsWarmingError) {
        logLineupsWarming503(gw);
        return c.json({ error: 'lineups_warming' }, 503);
      }
      console.error('Error fetching predicted lineups:', error);
      return c.json({ error: 'Unable to fetch predicted lineups' }, { status: 500 });
    }
  }
);
