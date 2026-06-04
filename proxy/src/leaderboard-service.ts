import { db } from './db/client';
import { getOrFetchBootstrap, getOrFetchGwLive } from './fpl-cache/db-cache';
import { deriveSeason } from './fpl-cache/season';
import type { FPLLive } from './fpl-client';
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
  const bootstrap = await getOrFetchBootstrap(db);
  const season = deriveSeason(bootstrap.events);

  const event = bootstrap.events.find((e) => e.id === gw);
  if (!event) throw new Error(`Gameweek ${gw} not found`);

  let liveData: FPLLive;
  try {
    liveData = await getOrFetchGwLive(db, season, gw, bootstrap.events);
  } catch {
    liveData = { elements: [] };
  }

  const elementMap = new Map(bootstrap.elements.map((e) => [e.id, e]));
  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t]));

  const allPlayers = liveData.elements.flatMap((live) => {
    const element = elementMap.get(live.id);
    if (!element) return [];
    const team = teamMap.get(element.team);
    return [
      {
        id: live.id,
        webName: element.web_name,
        position: (POSITION_MAP[element.element_type] ?? 'GK') as PlayerPosition,
        teamCode: element.team_code,
        teamShortName: team?.short_name ?? 'UNK',
        bps: live.stats.bonus,
        defcon: sumDefcon(live.explain),
      },
    ];
  });

  const bps: LeaderboardPlayer[] = allPlayers
    .filter((p) => p.bps > 0)
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
  const bootstrap = await getOrFetchBootstrap(db);
  const season = deriveSeason(bootstrap.events);
  const finishedEvents = bootstrap.events.filter((e) => e.finished);

  const liveDataArr = await Promise.all(
    finishedEvents.map(async (event) => {
      try {
        return await getOrFetchGwLive(db, season, event.id, bootstrap.events);
      } catch {
        return { elements: [] } as FPLLive;
      }
    }),
  );

  const elementMap = new Map(bootstrap.elements.map((e) => [e.id, e]));
  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t]));

  const bpsAgg = new Map<number, number>();
  const defconAgg = new Map<number, number>();
  const gamesPlayedAgg = new Map<number, number>();

  for (const liveData of liveDataArr) {
    for (const live of liveData.elements) {
      bpsAgg.set(live.id, (bpsAgg.get(live.id) ?? 0) + live.stats.bonus);
      defconAgg.set(live.id, (defconAgg.get(live.id) ?? 0) + sumDefcon(live.explain));
      if (live.stats.minutes > 0) {
        gamesPlayedAgg.set(live.id, (gamesPlayedAgg.get(live.id) ?? 0) + 1);
      }
    }
  }

  function buildList(
    valueMap: Map<number, number>,
    excludeZero: boolean,
    gamesPlayedMap?: Map<number, number>,
  ): LeaderboardPlayer[] {
    const players: LeaderboardPlayer[] = [];
    for (const [id, value] of valueMap) {
      if (excludeZero && value <= 0) continue;
      const element = elementMap.get(id);
      if (!element) continue;
      const team = teamMap.get(element.team);
      const gamesPlayed = gamesPlayedMap?.get(id) ?? 0;
      const avg = gamesPlayed > 0 ? Math.round((value / gamesPlayed) * 10) / 10 : undefined;
      players.push({
        id,
        webName: element.web_name,
        position: (POSITION_MAP[element.element_type] ?? 'GK') as PlayerPosition,
        teamCode: element.team_code,
        teamShortName: team?.short_name ?? 'UNK',
        value,
        ...(avg !== undefined ? { avg } : {}),
      });
    }
    return players.sort((a, b) => b.value - a.value).slice(0, TOP_N);
  }

  return {
    bps: buildList(bpsAgg, true),
    defcon: buildList(defconAgg, true, gamesPlayedAgg),
  };
}
