import * as cacheLayer from './cache';
import type { FPLBootstrapStatic, FPLLive } from './fpl-client';
import * as fplClient from './fpl-client';
import type {
  LeaderboardGwResponse,
  LeaderboardPlayer,
  LeaderboardSeasonResponse,
  PlayerPosition,
} from './types';

const TOP_N = 50;

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

async function getLiveWithCache(gw: number, finished: boolean): Promise<FPLLive> {
  const key = `live:${gw}`;
  const cached = cacheLayer.get<FPLLive>(key);
  if (cached) return cached;
  let data: FPLLive;
  try {
    data = await fplClient.getLive(gw);
  } catch {
    return { elements: [] };
  }
  const ttl = finished ? cacheLayer.ttl.LEADERBOARD_GW_FINISHED : cacheLayer.ttl.LEADERBOARD_GW_LIVE;
  cacheLayer.set(key, data, ttl);
  return data;
}

function sumDefcon(explain: FPLLive['elements'][0]['explain']): number {
  let total = 0;
  for (const fixture of explain) {
    for (const stat of fixture.stats) {
      if (stat.identifier === 'defensive_contribution') total += stat.value;
    }
  }
  return total;
}

export async function getLeaderboardGw(gw: number): Promise<LeaderboardGwResponse> {
  const bootstrap = await getBootstrapWithCache();

  const event = bootstrap.events.find((e) => e.id === gw);
  if (!event) throw new Error(`Gameweek ${gw} not found`);

  const liveData = await getLiveWithCache(gw, event.finished);

  const elementMap = new Map(bootstrap.elements.map((e) => [e.id, e]));
  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t]));

  const allPlayers = liveData.elements.flatMap((live) => {
    const element = elementMap.get(live.id);
    if (!element) return [];
    const team = teamMap.get(element.team);
    return [{
      id: live.id,
      webName: element.web_name,
      position: (POSITION_MAP[element.element_type] ?? 'GK') as PlayerPosition,
      teamCode: element.team_code,
      teamShortName: team?.short_name ?? 'UNK',
      bps: live.stats.bps,
      defcon: sumDefcon(live.explain),
    }];
  });

  const bps: LeaderboardPlayer[] = allPlayers
    .slice()
    .sort((a, b) => b.bps - a.bps)
    .slice(0, TOP_N)
    .map(({ bps: value, defcon: _d, ...p }) => ({ ...p, value }));

  const defcon: LeaderboardPlayer[] = allPlayers
    .filter((p) => p.defcon > 0)
    .sort((a, b) => b.defcon - a.defcon)
    .slice(0, TOP_N)
    .map(({ defcon: value, bps: _b, ...p }) => ({ ...p, value }));

  return { gw, bps, defcon };
}

export async function getLeaderboardSeason(): Promise<LeaderboardSeasonResponse> {
  const bootstrap = await getBootstrapWithCache();
  const finishedEvents = bootstrap.events.filter((e) => e.finished);

  const liveDataArr = await Promise.all(
    finishedEvents.map((event) => getLiveWithCache(event.id, true))
  );

  const elementMap = new Map(bootstrap.elements.map((e) => [e.id, e]));
  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t]));

  const bpsAgg = new Map<number, number>();
  const defconAgg = new Map<number, number>();

  for (const liveData of liveDataArr) {
    for (const live of liveData.elements) {
      bpsAgg.set(live.id, (bpsAgg.get(live.id) ?? 0) + live.stats.bps);
      defconAgg.set(live.id, (defconAgg.get(live.id) ?? 0) + sumDefcon(live.explain));
    }
  }

  function buildList(valueMap: Map<number, number>, excludeZero: boolean): LeaderboardPlayer[] {
    const players: LeaderboardPlayer[] = [];
    for (const [id, value] of valueMap) {
      if (excludeZero && value === 0) continue;
      const element = elementMap.get(id);
      if (!element) continue;
      const team = teamMap.get(element.team);
      players.push({
        id,
        webName: element.web_name,
        position: (POSITION_MAP[element.element_type] ?? 'GK') as PlayerPosition,
        teamCode: element.team_code,
        teamShortName: team?.short_name ?? 'UNK',
        value,
      });
    }
    return players.sort((a, b) => b.value - a.value).slice(0, TOP_N);
  }

  return {
    bps: buildList(bpsAgg, false),
    defcon: buildList(defconAgg, true),
  };
}
