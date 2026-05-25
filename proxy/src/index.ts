import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as dreamTeamService from './dream-team-service';
import * as entryService from './entry-service';
import * as gameweeksService from './gameweeks-service';
import * as historyService from './history-service';
import * as leaguesService from './leagues-service';
import * as squadService from './squad-service';
import * as teamService from './team-service';
import * as topPlayersService from './top-players-service';
import { MAX_GAMEWEEK } from './types';

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

// GET /api/entry/:teamId/leagues
app.get('/api/entry/:teamId/leagues', async (c) => {
  try {
    const teamId = parseInt(c.req.param('teamId'), 10);
    if (isNaN(teamId) || teamId <= 0) {
      return c.json({ error: 'Invalid team ID' }, { status: 400 });
    }
    const result = await leaguesService.getLeagues(teamId);
    return c.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('404')) {
      return c.json({ error: 'Team not found' }, { status: 404 });
    }
    console.error('Error fetching leagues:', error);
    return c.json({ error: 'Unable to fetch leagues' }, { status: 500 });
  }
});

// GET /api/entry/:teamId/history
app.get('/api/entry/:teamId/history', async (c) => {
  try {
    const teamId = parseInt(c.req.param('teamId'), 10);
    if (isNaN(teamId) || teamId <= 0) {
      return c.json({ error: 'Invalid team ID' }, { status: 400 });
    }
    const result = await historyService.getHistory(teamId);
    return c.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('404')) {
      return c.json({ error: 'Team not found' }, { status: 404 });
    }
    console.error('Error fetching history:', error);
    return c.json({ error: 'Unable to fetch history' }, { status: 500 });
  }
});

// GET /api/squad/:teamId/:gw
app.get('/api/squad/:teamId/:gw', async (c) => {
  try {
    const teamId = parseInt(c.req.param('teamId'), 10);
    const gw = parseInt(c.req.param('gw'), 10);

    if (isNaN(teamId) || teamId <= 0 || isNaN(gw) || gw < 1 || gw > MAX_GAMEWEEK) {
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

// GET /api/dream-team/:gw
app.get('/api/dream-team/:gw', async (c) => {
  const gw = parseInt(c.req.param('gw'), 10);

  if (isNaN(gw) || gw < 1 || gw > MAX_GAMEWEEK) {
    return c.json({ error: 'Invalid gameweek' }, { status: 400 });
  }

  try {
    const result = await dreamTeamService.getDreamTeam(gw);
    return c.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('not yet finished')) {
      return c.json({ error: `Dream Team is not yet available for gameweek ${gw}` }, { status: 400 });
    }
    if (errorMsg.includes('not found')) {
      return c.json({ error: `Gameweek ${gw} not found` }, { status: 404 });
    }
    console.error('Error fetching dream team:', error);
    return c.json({ error: 'Unable to fetch dream team' }, { status: 500 });
  }
});

// GET /api/teams
app.get('/api/teams', async (c) => {
  try {
    const result = await teamService.getTeams();
    return c.json(result);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return c.json({ error: 'Unable to fetch teams' }, { status: 500 });
  }
});

// GET /api/team-players/:teamCode
app.get('/api/team-players/:teamCode', async (c) => {
  const teamCode = parseInt(c.req.param('teamCode'), 10);

  if (isNaN(teamCode) || teamCode < 1) {
    return c.json({ error: 'Invalid team code' }, { status: 400 });
  }

  try {
    const result = await teamService.getTeamPlayers(teamCode);
    return c.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('not found')) {
      return c.json({ error: `Team ${teamCode} not found` }, { status: 404 });
    }
    console.error('Error fetching team players:', error);
    return c.json({ error: 'Unable to fetch team players' }, { status: 500 });
  }
});

// GET /api/top-players/gameweek/:gw
app.get('/api/top-players/gameweek/:gw', async (c) => {
  const gw = parseInt(c.req.param('gw'), 10);

  if (isNaN(gw) || gw < 1 || gw > MAX_GAMEWEEK) {
    return c.json({ error: 'Invalid gameweek' }, { status: 400 });
  }

  try {
    const result = await topPlayersService.getTopPlayersGameweek(gw);
    return c.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('not found')) {
      return c.json({ error: `Gameweek ${gw} not found` }, { status: 404 });
    }
    console.error('Error fetching top players for gameweek:', error);
    return c.json({ error: 'Unable to fetch top players' }, { status: 500 });
  }
});

// GET /api/top-players/season
app.get('/api/top-players/season', async (c) => {
  try {
    const result = await topPlayersService.getTopPlayersSeason();
    return c.json(result);
  } catch (error) {
    console.error('Error fetching top players for season:', error);
    return c.json({ error: 'Unable to fetch top players' }, { status: 500 });
  }
});

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Proxy server running on port ${port}`);
});
