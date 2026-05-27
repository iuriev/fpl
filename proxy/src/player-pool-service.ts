import * as cacheLayer from './cache';
import * as fplClient from './fpl-client';
import * as fixturesService from './fixtures-service';
import type { FPLBootstrapStatic } from './fpl-client';
import type { PlayerPoolResponse, PoolPlayer, PlayerPosition, PlayerStatus } from './types';

const POSITION_MAP: Record<number, PlayerPosition> = {
  1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD',
};

async function getBootstrapWithCache(): Promise<FPLBootstrapStatic> {
  const cached = cacheLayer.get<FPLBootstrapStatic>('bootstrap-static');
  if (cached) return cached;
  const bootstrap = await fplClient.getBootstrapStatic();
  cacheLayer.set('bootstrap-static', bootstrap, cacheLayer.ttl.BOOTSTRAP);
  return bootstrap;
}

export async function getPlayerPool(): Promise<PlayerPoolResponse> {
  const cacheKey = 'player-pool';
  const cached = cacheLayer.get<PlayerPoolResponse>(cacheKey);
  if (cached) return cached;

  const [bootstrap, fixtures] = await Promise.all([
    getBootstrapWithCache(),
    fixturesService.getUpcomingFixtures(),
  ]);

  const teamMap = new Map(
    bootstrap.teams.map((t) => [t.id, { shortName: t.short_name, code: t.code }])
  );

  const players: PoolPlayer[] = bootstrap.elements.map((el) => ({
    id: el.id,
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
    expectedPoints: el.ep_next,
    form: el.form,
    nextFixtures: fixtures[el.team] ?? [],
  }));

  const result: PlayerPoolResponse = { players };
  cacheLayer.set(cacheKey, result, cacheLayer.ttl.PLAYER_POOL);
  return result;
}
