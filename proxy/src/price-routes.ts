import { Hono } from 'hono';

import { type AuthVars, requireUser } from './auth/middleware';
import * as playerProfileService from './player-profile-service';
import { requirePremiumFplUser } from './premium-middleware';
import * as priceChangesService from './price-changes-service';
import * as pricePredictionsService from './price-predictions-service';
import type { PositionFilter } from './price-shared';
import { getSquadPlayerIds } from './squad-player-ids';
import type {
  PriceChangeDirection,
  PriceChangePeriod,
  PricePredictionDirection,
} from './types';

const VALID_POSITIONS = new Set(['all', 'GK', 'DEF', 'MID', 'FWD']);

function parsePosition(raw: string | undefined): PositionFilter | null {
  const value = raw ?? 'all';
  if (!VALID_POSITIONS.has(value)) return null;
  return value as PositionFilter;
}

function parsePeriod(raw: string | undefined): PriceChangePeriod | null {
  if (raw === 'gw' || raw === 'season') return raw;
  return null;
}

function parseChangeDirection(raw: string | undefined): PriceChangeDirection | null {
  if (raw === 'rise' || raw === 'fall') return raw;
  return null;
}

function parsePredictionDirection(raw: string | undefined): PricePredictionDirection | null {
  if (raw === 'rise' || raw === 'fall') return raw;
  return null;
}

export const priceRoutes = new Hono<AuthVars>();

priceRoutes.get('/price-changes', async (c) => {
  const period = parsePeriod(c.req.query('period'));
  const direction = parseChangeDirection(c.req.query('direction'));
  const position = parsePosition(c.req.query('position'));
  if (!period || !direction || !position) {
    return c.json({ error: 'Invalid query parameters' }, 400);
  }

  try {
    const result = await priceChangesService.getPriceChanges(period, direction, position);
    return c.json(result);
  } catch (error) {
    console.error('Error fetching price changes:', error);
    return c.json({ error: 'Unable to fetch price changes' }, { status: 500 });
  }
});

priceRoutes.get('/price-changes/squad', requireUser, requirePremiumFplUser, async (c) => {
  const period = parsePeriod(c.req.query('period'));
  const direction = parseChangeDirection(c.req.query('direction'));
  const position = parsePosition(c.req.query('position'));
  if (!period || !direction || !position) {
    return c.json({ error: 'Invalid query parameters' }, 400);
  }

  try {
    const teamId = c.var.fplTeamId;
    const playerIds = await getSquadPlayerIds(teamId);
    const result = await priceChangesService.getPriceChangesForSquad(
      period,
      direction,
      position,
      playerIds
    );
    return c.json(result);
  } catch (error) {
    console.error('Error fetching squad price changes:', error);
    return c.json({ error: 'Unable to fetch price changes' }, { status: 500 });
  }
});

priceRoutes.get('/price-predictions', async (c) => {
  const direction = parsePredictionDirection(c.req.query('direction'));
  const position = parsePosition(c.req.query('position'));
  if (!direction || !position) {
    return c.json({ error: 'Invalid query parameters' }, 400);
  }

  try {
    const result = await pricePredictionsService.getPricePredictions(direction, position);
    return c.json(result);
  } catch (error) {
    console.error('Error fetching price predictions:', error);
    return c.json({ error: 'Unable to fetch price predictions' }, { status: 500 });
  }
});

priceRoutes.get('/price-predictions/squad', requireUser, requirePremiumFplUser, async (c) => {
  const direction = parsePredictionDirection(c.req.query('direction'));
  const position = parsePosition(c.req.query('position'));
  if (!direction || !position) {
    return c.json({ error: 'Invalid query parameters' }, 400);
  }

  try {
    const teamId = c.var.fplTeamId;
    const playerIds = await getSquadPlayerIds(teamId);
    const result = await pricePredictionsService.getPricePredictionsForSquad(
      direction,
      position,
      playerIds
    );
    return c.json(result);
  } catch (error) {
    console.error('Error fetching squad price predictions:', error);
    return c.json({ error: 'Unable to fetch price predictions' }, { status: 500 });
  }
});

priceRoutes.get('/players/:playerId/profile', async (c) => {
  const playerId = parseInt(c.req.param('playerId'), 10);
  if (isNaN(playerId) || playerId < 1) {
    return c.json({ error: 'Invalid player ID' }, 400);
  }

  const gwParam = c.req.query('gw');
  const gw = gwParam ? parseInt(gwParam, 10) : undefined;
  if (gwParam && (gw === undefined || isNaN(gw) || gw < 1 || gw > 38)) {
    return c.json({ error: 'Invalid gameweek' }, 400);
  }

  try {
    const result = await playerProfileService.getPlayerProfile(playerId, gw);
    return c.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('not found')) {
      return c.json({ error: 'Player not found' }, 404);
    }
    console.error('Error fetching player profile:', error);
    return c.json({ error: 'Unable to fetch player profile' }, { status: 500 });
  }
});
