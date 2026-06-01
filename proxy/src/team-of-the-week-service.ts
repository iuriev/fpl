import * as cacheLayer from './cache';
import type { FPLBootstrapStatic, FPLDreamTeam } from './fpl-client';
import * as fplClient from './fpl-client';
import type { TeamOfTheWeekPlayer, TeamOfTheWeekResponse, PlayerPosition } from './types';

const POSITION_MAP: Record<number, PlayerPosition> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

const POSITION_ORDER: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];

async function getBootstrapWithCache(): Promise<FPLBootstrapStatic> {
  const cached = cacheLayer.get<FPLBootstrapStatic>('bootstrap-static');
  if (cached) return cached;

  const bootstrap = await fplClient.getBootstrapStatic();
  cacheLayer.set('bootstrap-static', bootstrap, cacheLayer.ttl.BOOTSTRAP);
  return bootstrap;
}

async function getTeamOfTheWeekWithCache(gameweek: number): Promise<FPLDreamTeam> {
  const cacheKey = `team-of-the-week:${gameweek}`;
  const cached = cacheLayer.get<FPLDreamTeam>(cacheKey);
  if (cached) return cached;

  const data = await fplClient.getDreamTeam(gameweek);
  cacheLayer.set(cacheKey, data, cacheLayer.ttl.SQUAD_FINISHED);
  return data;
}

export async function getTeamOfTheWeek(gameweek: number): Promise<TeamOfTheWeekResponse> {
  const bootstrap = await getBootstrapWithCache();

  const gameweekEvent = bootstrap.events.find((e) => e.id === gameweek);
  if (!gameweekEvent) throw new Error(`Gameweek ${gameweek} not found`);
  if (!gameweekEvent.finished) throw new Error(`Gameweek ${gameweek} not yet finished`);

  const teamOfTheWeekData = await getTeamOfTheWeekWithCache(gameweek);

  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t]));
  const playerMap = new Map(bootstrap.elements.map((e) => [e.id, e]));

  const players: TeamOfTheWeekPlayer[] = teamOfTheWeekData.team.map((entry) => {
    const playerData = playerMap.get(entry.element);
    if (!playerData) throw new Error(`Player ${entry.element} not found in bootstrap`);

    const team = teamMap.get(playerData.team);

    return {
      id: entry.element,
      webName: playerData.web_name,
      position: POSITION_MAP[playerData.element_type] ?? 'GK',
      teamCode: playerData.team_code,
      teamShortName: team?.short_name ?? 'UNK',
      points: entry.points,
      pitchPosition: entry.position,
    };
  });

  players.sort((a, b) => {
    const posA = POSITION_ORDER.indexOf(a.position);
    const posB = POSITION_ORDER.indexOf(b.position);
    if (posA !== posB) return posA - posB;
    return a.pitchPosition - b.pitchPosition;
  });

  return { gw: gameweek, players };
}
