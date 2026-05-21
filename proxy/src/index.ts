/**
 * FPL Proxy — Hono server fronting the public FPL API.
 * Phase 3 implementation: full endpoint suite with caching and composition.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as gameweeksService from './gameweeks-service';
import * as entryService from './entry-service';
import * as squadService from './squad-service';

const app = new Hono();

// Enable CORS to allow the web app to call this proxy
app.use('*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// GET /api/gameweeks
app.get('/api/gameweeks', async (c) => {
  try {
    const result = await gameweeksService.getGameweeks();
    return c.json(result);
  } catch (error) {
    console.error('Error fetching gameweeks:', error);
    return c.json(
      { error: 'Unable to fetch gameweeks' },
      { status: 500 },
    );
  }
});

// GET /api/entry/:teamId
app.get('/api/entry/:teamId', async (c) => {
  try {
    const teamId = parseInt(c.req.param('teamId'), 10);
    if (isNaN(teamId) || teamId <= 0) {
      return c.json(
        { error: 'Invalid team ID' },
        { status: 400 },
      );
    }

    const result = await entryService.getEntry(teamId);
    return c.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('404')) {
      return c.json(
        { error: 'Team not found' },
        { status: 404 },
      );
    }
    console.error('Error fetching entry:', error);
    return c.json(
      { error: 'Unable to fetch team information' },
      { status: 500 },
    );
  }
});

// GET /api/squad/:teamId/:gw
app.get('/api/squad/:teamId/:gw', async (c) => {
  try {
    const teamId = parseInt(c.req.param('teamId'), 10);
    const gw = parseInt(c.req.param('gw'), 10);

    if (isNaN(teamId) || teamId <= 0 || isNaN(gw) || gw <= 0) {
      return c.json(
        { error: 'Invalid team ID or gameweek' },
        { status: 400 },
      );
    }

    const result = await squadService.getSquad(teamId, gw);
    return c.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('No picks available')) {
      return c.json(
        { error: `No squad available for gameweek ${c.req.param('gw')}` },
        { status: 404 },
      );
    }
    if (errorMsg.includes('not found')) {
      return c.json(
        { error: 'Team or gameweek not found' },
        { status: 404 },
      );
    }
    console.error('Error fetching squad:', error);
    return c.json(
      { error: 'Unable to fetch squad' },
      { status: 500 },
    );
  }
});

const port = process.env.PORT || 3001;

console.log(`Proxy server running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
