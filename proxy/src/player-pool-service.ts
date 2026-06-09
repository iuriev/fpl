import * as cacheLayer from './cache';
import { db } from './db/client';
import * as fixturesService from './fixtures-service';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
import * as predictionService from './prediction-service';
import { resolveNextGw } from './resolve-next-gw';
import type { PlayerPoolResponse, PlayerPosition, PlayerStatus, PoolPlayer } from './types';

const POSITION_MAP: Record<number, PlayerPosition> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

export async function getPlayerPool(): Promise<PlayerPoolResponse> {
  const cacheKey = 'player-pool';
  const cached = cacheLayer.get<PlayerPoolResponse>(cacheKey);
  if (cached) return cached;

  const [bootstrap, fixtures] = await Promise.all([
    getOrFetchBootstrap(db),
    fixturesService.getUpcomingFixtures(),
  ]);

  const targetGw = resolveNextGw(bootstrap);
  const predictions = await predictionService.getPredictionsForEvent(targetGw);
  const xPtsByCode = predictions.ready
    ? new Map(predictions.players.map((p) => [p.fplCode, p.xPts] as const))
    : null;

  const teamMap = new Map(
    bootstrap.teams.map((t) => [t.id, { shortName: t.short_name, code: t.code }]),
  );

  const players: PoolPlayer[] = bootstrap.elements.map((el) => ({
    id: el.id,
    code: el.code,
    webName: el.web_name,
    firstName: el.first_name,
    lastName: el.second_name,
    team: el.team,
    teamCode: el.team_code,
    teamShortName: teamMap.get(el.team)?.shortName ?? '???',
    position: POSITION_MAP[el.element_type] ?? 'GK',
    nowCost: el.now_cost,
    totalPoints: el.total_points,
    eventPoints: el.event_points,
    status: el.status as PlayerStatus,
    chanceOfPlaying: el.chance_of_playing_this_round,
    news: el.news,
    selectedByPercent: el.selected_by_percent,
    expectedPoints:
      xPtsByCode?.get(el.code) != null
        ? xPtsByCode.get(el.code)!.toFixed(1)
        : el.ep_next,
    form: el.form,
    nextFixtures: fixtures[el.team] ?? [],
    isWatchlisted: false,
  }));

  const result: PlayerPoolResponse = { players };
  cacheLayer.set(cacheKey, result, cacheLayer.ttl.PLAYER_POOL);
  return result;
}
