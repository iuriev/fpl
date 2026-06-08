import * as cacheLayer from './cache';
import type { FPLBootstrapStatic } from './fpl-client';
import * as fplClient from './fpl-client';
import type {
  PlayerPosition,
  TeamInfo,
  TeamPlayersResponse,
  TeamsResponse,
  TopPlayer,
} from './types';

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

export async function getTeams(): Promise<TeamsResponse> {
  const bootstrap = await getBootstrapWithCache();

  const teams: TeamInfo[] = bootstrap.teams
    .map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      shortName: t.short_name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { teams };
}

export async function getTeamPlayers(teamCode: number): Promise<TeamPlayersResponse> {
  const bootstrap = await getBootstrapWithCache();

  const team = bootstrap.teams.find((t) => t.code === teamCode);
  if (!team) throw new Error(`Team with code ${teamCode} not found`);

  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t]));

  const players: TopPlayer[] = bootstrap.elements
    .filter((e) => e.team_code === teamCode)
    .map((e) => ({
      id: e.id,
      fplCode: e.code,
      webName: e.web_name,
      position: POSITION_MAP[e.element_type] ?? 'GK',
      teamCode: e.team_code,
      teamShortName: teamMap.get(e.team)?.short_name ?? 'UNK',
      points: e.total_points,
      selectedByPercent: e.selected_by_percent,
    }))
    .sort((a, b) => b.points - a.points);

  return {
    teamCode: team.code,
    teamName: team.name,
    teamShortName: team.short_name,
    players,
  };
}
