import * as cacheLayer from './cache';
import type { FPLBootstrapStatic, FPLLive } from './fpl-client';
import * as fplClient from './fpl-client';
import type { PlayerPosition, StatEntry, TopPlayer, TopPlayersGameweekResponse, TopPlayersSeasonResponse } from './types';

const TOP_N = 100;

const HIDDEN_STAT_IDENTIFIERS = new Set(['goals_conceded', 'bps']);

function buildStatBreakdown(explain: FPLLive['elements'][0]['explain']): StatEntry[] {
  const map = new Map<string, StatEntry>();
  for (const fixture of explain) {
    for (const stat of fixture.stats) {
      if (stat.value === 0 || HIDDEN_STAT_IDENTIFIERS.has(stat.identifier)) continue;
      const existing = map.get(stat.identifier);
      if (existing) {
        existing.value += stat.value;
        existing.points += stat.points;
      } else {
        map.set(stat.identifier, { identifier: stat.identifier, value: stat.value, points: stat.points });
      }
    }
  }
  return Array.from(map.values());
}

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
        selectedByPercent: element.selected_by_percent,
        statBreakdown: buildStatBreakdown(live.explain),
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
        selectedByPercent: element.selected_by_percent,
      } satisfies TopPlayer;
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, TOP_N);

  return { players };
}
