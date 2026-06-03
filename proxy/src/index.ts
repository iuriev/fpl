import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { auth } from './auth/auth';
import { optionalUser } from './auth/middleware';
import { runMigrations } from './db/client';
import { db } from './db/client';
import { playerWatchlistEntry } from './db/schema';
import * as entryService from './entry-service';
import * as fixturesService from './fixtures-service';
import * as gameweeksService from './gameweeks-service';
import * as historyService from './history-service';
import * as leaderboardService from './leaderboard-service';
import * as leagueStandingsService from './league-standings-service';
import * as leaguesService from './leagues-service';
import { me } from './me-routes';
import * as playerPoolService from './player-pool-service';
import { priceRoutes } from './price-routes';
import * as squadService from './squad-service';
import * as teamOfTheWeekService from './team-of-the-week-service';
import * as teamService from './team-service';
import * as topPlayersService from './top-players-service';
import * as transfersService from './transfers-service';
import { MAX_GAMEWEEK } from './types';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

if (!process.env.BETTER_AUTH_SECRET) {
  console.error('BETTER_AUTH_SECRET is required');
  process.exit(1);
}

await runMigrations();

const isDev = process.env.NODE_ENV !== 'production';

const app = new Hono();

// Enable CORS to allow the web app to call this proxy
app.use('*', cors());

if (isDev) {
  app.use('*', logger());
}

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
    return c.json({ error: 'Unable to fetch gameweeks' }, { status: 500 });
  }
});

// GET /api/entry/:teamId
app.get('/api/entry/:teamId', async (c) => {
  try {
    const teamId = parseInt(c.req.param('teamId'), 10);
    if (isNaN(teamId) || teamId <= 0) {
      return c.json({ error: 'Invalid team ID' }, { status: 400 });
    }

    const result = await entryService.getEntry(teamId);
    return c.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('404')) {
      return c.json({ error: 'Team not found' }, { status: 404 });
    }
    console.error('Error fetching entry:', error);
    return c.json({ error: 'Unable to fetch team information' }, { status: 500 });
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

// GET /api/entry/:teamId/transfers
app.get('/api/entry/:teamId/transfers', async (c) => {
  try {
    const teamId = parseInt(c.req.param('teamId'), 10);
    if (isNaN(teamId) || teamId <= 0) {
      return c.json({ error: 'Invalid team ID' }, { status: 400 });
    }
    const result = await transfersService.getTransfers(teamId);
    return c.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('404')) {
      return c.json({ error: 'Team not found' }, { status: 404 });
    }
    console.error('Error fetching transfers:', error);
    return c.json({ error: 'Unable to fetch transfers' }, { status: 500 });
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
app.get('/api/squad/:teamId/:gw', optionalUser, async (c) => {
  try {
    const teamId = parseInt(c.req.param('teamId'), 10);
    const gw = parseInt(c.req.param('gw'), 10);

    if (isNaN(teamId) || teamId <= 0 || isNaN(gw) || gw < 1 || gw > MAX_GAMEWEEK) {
      return c.json({ error: 'Invalid team ID or gameweek' }, { status: 400 });
    }

    const user = c.var.user;
    const [result, watchlistedIds] = await Promise.all([
      squadService.getSquad(teamId, gw),
      user
        ? db
            .select({ playerId: playerWatchlistEntry.playerId })
            .from(playerWatchlistEntry)
            .where(eq(playerWatchlistEntry.userId, user.id))
            .then((rows) => new Set(rows.map((r) => r.playerId)))
        : Promise.resolve(new Set<number>()),
    ]);

    const withWatchlist = {
      ...result,
      starters: result.starters.map((p) => ({ ...p, isWatchlisted: watchlistedIds.has(p.id) })),
      bench: result.bench.map((p) => ({ ...p, isWatchlisted: watchlistedIds.has(p.id) })),
    };

    return c.json(withWatchlist);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('No picks available')) {
      return c.json(
        { error: `No squad available for gameweek ${c.req.param('gw')}` },
        { status: 404 }
      );
    }
    if (errorMsg.includes('not found')) {
      return c.json({ error: 'Team or gameweek not found' }, { status: 404 });
    }
    console.error('Error fetching squad:', error);
    return c.json({ error: 'Unable to fetch squad' }, { status: 500 });
  }
});

// GET /api/fixtures/upcoming
app.get('/api/fixtures/upcoming', async (c) => {
  try {
    const result = await fixturesService.getUpcomingFixtures();
    return c.json(result);
  } catch (error) {
    console.error('Error fetching upcoming fixtures:', error);
    return c.json({ error: 'Unable to fetch fixtures' }, { status: 500 });
  }
});

// GET /api/player-pool
app.get('/api/player-pool', optionalUser, async (c) => {
  try {
    const user = c.var.user;
    const [result, watchlistedIds] = await Promise.all([
      playerPoolService.getPlayerPool(),
      user
        ? db
            .select({ playerId: playerWatchlistEntry.playerId })
            .from(playerWatchlistEntry)
            .where(eq(playerWatchlistEntry.userId, user.id))
            .then((rows) => new Set(rows.map((r) => r.playerId)))
        : Promise.resolve(new Set<number>()),
    ]);

    return c.json({
      players: result.players.map((p) => ({ ...p, isWatchlisted: watchlistedIds.has(p.id) })),
    });
  } catch (error) {
    console.error('Error fetching player pool:', error);
    return c.json({ error: 'Unable to fetch player pool' }, { status: 500 });
  }
});

// GET /api/team-of-the-week/:gw
app.get('/api/team-of-the-week/:gw', async (c) => {
  const gw = parseInt(c.req.param('gw'), 10);

  if (isNaN(gw) || gw < 1 || gw > MAX_GAMEWEEK) {
    return c.json({ error: 'Invalid gameweek' }, { status: 400 });
  }

  try {
    const result = await teamOfTheWeekService.getTeamOfTheWeek(gw);
    return c.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('not yet finished')) {
      return c.json(
        { error: `Team of the Week is not yet available for gameweek ${gw}` },
        { status: 400 }
      );
    }
    if (errorMsg.includes('not found')) {
      return c.json({ error: `Gameweek ${gw} not found` }, { status: 404 });
    }
    console.error('Error fetching team of the week:', error);
    return c.json({ error: 'Unable to fetch team of the week' }, { status: 500 });
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

// GET /api/players/live/:gw?ids=1,2,3
app.get('/api/players/live/:gw', async (c) => {
  const gw = parseInt(c.req.param('gw'), 10);
  if (isNaN(gw) || gw < 1 || gw > MAX_GAMEWEEK) {
    return c.json({ error: 'Invalid gameweek' }, { status: 400 });
  }

  const idsParam = c.req.query('ids') ?? '';
  const ids = idsParam
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0);

  if (ids.length === 0) {
    return c.json({ gw, players: [] });
  }

  try {
    const result = await topPlayersService.getPlayersLiveGw(gw, ids);
    return c.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('not found')) {
      return c.json({ error: `Gameweek ${gw} not found` }, { status: 404 });
    }
    console.error('Error fetching live player data:', error);
    return c.json({ error: 'Unable to fetch live player data' }, { status: 500 });
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

// GET /api/leagues/:leagueId/standings
app.get('/api/leagues/:leagueId/standings', async (c) => {
  try {
    const leagueId = parseInt(c.req.param('leagueId'), 10);
    if (isNaN(leagueId) || leagueId <= 0) {
      return c.json({ error: 'Invalid league ID' }, { status: 400 });
    }
    const pageParam = c.req.query('page') ?? '1';
    const page = parseInt(pageParam, 10);
    if (isNaN(page) || page < 1) {
      return c.json({ error: 'Invalid page number' }, { status: 400 });
    }
    const result = await leagueStandingsService.getLeagueStandings(leagueId, page);
    return c.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('404')) {
      return c.json({ error: 'League not found' }, { status: 404 });
    }
    console.error('Error fetching league standings:', error);
    return c.json({ error: 'Unable to fetch league standings' }, { status: 500 });
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

// GET /api/leaderboard/gw/:gw
app.get('/api/leaderboard/gw/:gw', async (c) => {
  try {
    const gw = parseInt(c.req.param('gw'), 10);
    if (isNaN(gw) || gw < 1 || gw > MAX_GAMEWEEK) {
      return c.json({ error: 'Invalid gameweek' }, { status: 400 });
    }
    const result = await leaderboardService.getLeaderboardGw(gw);
    return c.json(result);
  } catch (error) {
    console.error('Error fetching leaderboard GW:', error);
    return c.json({ error: 'Unable to fetch leaderboard' }, { status: 500 });
  }
});

// GET /api/leaderboard/season
app.get('/api/leaderboard/season', async (c) => {
  try {
    const result = await leaderboardService.getLeaderboardSeason();
    return c.json(result);
  } catch (error) {
    console.error('Error fetching season leaderboard:', error);
    return c.json({ error: 'Unable to fetch season leaderboard' }, { status: 500 });
  }
});

app.route('/api', priceRoutes);

app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));
app.route('/api/me', me);

if (process.env.NODE_ENV === 'production') {
  app.use('*', serveStatic({ root: './web/dist' }));
  app.get('*', serveStatic({ path: './web/dist/index.html' }));
}

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Proxy server running on port ${port}`);
});
