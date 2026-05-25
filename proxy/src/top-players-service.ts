import * as cacheLayer from './cache';
import * as fplClient from './fpl-client';
import type { FPLBootstrapStatic } from './fpl-client';
import type { PlayerPosition, TopPlayer, TopPlayersGameweekResponse, TopPlayersSeasonResponse } from './types';

const TOP_N = 100;

const POSITION_MAP: Record<number, PlayerPosition> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

async function getBootstrapWithCache(): Promise<FPLBootstrapStatic> {
  const cached = cacheLayer.get<FPLBootstrapStatic>('bootstrap-static');
  if (cached) return cached;

  const bootstrap = await fplClient.getBootstrapStatic();
  cacheLayer.set('bootstrap-static', bootstrap, cacheLayer.ttl.BOOTSTRAP);
  return bootstrap;
}

export async function getTopPlayersGameweek(gw: number): Promise<TopPlayersGameweekResponse> {
  const bootstrap = await getBootstrapWithCache();

  const event = bootstrap.events.find((e) => e.id === gw);
  if (!event) throw new Error(`Gameweek ${gw} not found`);

  const liveCacheKey = `live:${gw}`;
  let liveData = cacheLayer.get<fplClient.FPLLive>(liveCacheKey);
  if (!liveData) {
    liveData = await fplClient.getLive(gw);
    const liveTtl = event.finished ? cacheLayer.ttl.SQUAD_FINISHED : cacheLayer.ttl.SQUAD_CURRENT;
    cacheLayer.set(liveCacheKey, liveData, liveTtl);
  }

  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t]));
  const elementMap = new Map(bootstrap.elements.map((e) => [e.id, e]));

  const players: TopPlayer[] = liveData.elements
    .map((live) => {
      const element = elementMap.get(live.id);
      if (!element) return null;
      const team = teamMap.get(element.team);
      return {
        id: live.id,
        webName: element.web_name,
        position: POSITION_MAP[element.element_type] ?? 'GK',
        teamCode: element.team_code,
        teamShortName: team?.short_name ?? 'UNK',
        points: live.stats.total_points,
      } satisfies TopPlayer;
    })
    .filter((p): p is TopPlayer => p !== null)
    .sort((a, b) => b.points - a.points)
    .slice(0, TOP_N);

  return { gw, players };
}

export async function getTopPlayersSeason(): Promise<TopPlayersSeasonResponse> {
  const bootstrap = await getBootstrapWithCache();

  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t]));

  const players: TopPlayer[] = bootstrap.elements
    .map((element) => {
      const team = teamMap.get(element.team);
      return {
        id: element.id,
        webName: element.web_name,
        position: POSITION_MAP[element.element_type] ?? 'GK',
        teamCode: element.team_code,
        teamShortName: team?.short_name ?? 'UNK',
        points: element.total_points,
      } satisfies TopPlayer;
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, TOP_N);

  return { players };
}
