import { Hono } from 'hono';

import * as predictionService from './prediction-service';
import { MAX_GAMEWEEK } from './types';

export const predictionRoutes = new Hono();

predictionRoutes.get('/predictions', async (c) => {
  const eventParam = c.req.query('event');
  const event = eventParam ? parseInt(eventParam, 10) : NaN;
  if (isNaN(event) || event < 1 || event > MAX_GAMEWEEK) {
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
