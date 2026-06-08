import { Hono } from 'hono';

import { requireUser } from './auth/middleware';
import * as marketService from './market-service';
import { requirePremiumFplUser } from './premium-middleware';
import { MAX_GAMEWEEK } from './types';

export const marketRoutes = new Hono();

function parseEvent(eventParam: string | undefined): number | null {
  const event = eventParam ? parseInt(eventParam, 10) : NaN;
  if (isNaN(event) || event < 1 || event > MAX_GAMEWEEK) return null;
  return event;
}

marketRoutes.get('/market/preview', requireUser, async (c) => {
  const event = parseEvent(c.req.query('event'));
  if (event === null) {
    return c.json({ error: 'Invalid event (gameweek)' }, { status: 400 });
  }
  try {
    const result = await marketService.getMarketPreviewForEvent(event);
    return c.json(result);
  } catch (error) {
    console.error('Error fetching market preview:', error);
    return c.json({ error: 'Unable to fetch market preview' }, { status: 500 });
  }
});

marketRoutes.get('/market', requireUser, requirePremiumFplUser, async (c) => {
  const event = parseEvent(c.req.query('event'));
  if (event === null) {
    return c.json({ error: 'Invalid event (gameweek)' }, { status: 400 });
  }
  try {
    const result = await marketService.getMarketForEvent(event);
    return c.json(result);
  } catch (error) {
    console.error('Error fetching market data:', error);
    return c.json({ error: 'Unable to fetch market data' }, { status: 500 });
  }
});
