import { Hono } from 'hono';

import { requireUser } from './auth/middleware';
import * as predictionService from './prediction-service';
import { requirePremiumFplUser } from './premium-middleware';
import { MAX_GAMEWEEK } from './types';

export const predictionRoutes = new Hono();

function parseEvent(eventParam: string | undefined): number | null {
  const event = eventParam ? parseInt(eventParam, 10) : NaN;
  if (isNaN(event) || event < 1 || event > MAX_GAMEWEEK) return null;
  return event;
}

predictionRoutes.get('/predictions/preview', requireUser, async (c) => {
  const event = parseEvent(c.req.query('event'));
  if (event === null) {
    return c.json({ error: 'Invalid event (gameweek)' }, { status: 400 });
  }
  try {
    const result = await predictionService.getPredictionsPreviewForEvent(event);
    return c.json(result);
  } catch (error) {
    console.error('Error fetching predictions preview:', error);
    return c.json({ error: 'Unable to fetch predictions preview' }, { status: 500 });
  }
});

predictionRoutes.get('/predictions', requireUser, requirePremiumFplUser, async (c) => {
  const event = parseEvent(c.req.query('event'));
  if (event === null) {
    return c.json({ error: 'Invalid event (gameweek)' }, { status: 400 });
  }
  try {
    const result = await predictionService.getPredictionsForEvent(event);
    return c.json(result);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return c.json({ error: 'Unable to fetch predictions' }, { status: 500 });
  }
});
