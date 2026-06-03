import { db } from './db/client';
import { getOrFetchBootstrap, getOrFetchDreamTeam } from './fpl-cache/db-cache';
import { deriveSeason } from './fpl-cache/season';
import type { PlayerPosition, TeamOfTheWeekPlayer, TeamOfTheWeekResponse } from './types';

const POSITION_MAP: Record<number, PlayerPosition> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

const POSITION_ORDER: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];

export async function getTeamOfTheWeek(gameweek: number): Promise<TeamOfTheWeekResponse> {
  const bootstrap = await getOrFetchBootstrap(db);
  const season = deriveSeason(bootstrap.events);

  const gameweekEvent = bootstrap.events.find((e) => e.id === gameweek);
  if (!gameweekEvent) throw new Error(`Gameweek ${gameweek} not found`);
  if (!gameweekEvent.finished) throw new Error(`Gameweek ${gameweek} not yet finished`);

  const teamOfTheWeekData = await getOrFetchDreamTeam(db, season, gameweek, bootstrap.events);

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
