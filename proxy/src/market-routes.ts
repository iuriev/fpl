import { Hono } from 'hono';

import * as marketService from './market-service';
import { MAX_GAMEWEEK } from './types';

export const marketRoutes = new Hono();

marketRoutes.get('/market', async (c) => {
  const eventParam = c.req.query('event');
  const event = eventParam ? parseInt(eventParam, 10) : NaN;
  if (isNaN(event) || event < 1 || event > MAX_GAMEWEEK) {
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
