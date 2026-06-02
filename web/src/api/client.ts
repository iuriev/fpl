/**
 * API client for the proxy endpoints.
 * Direct async functions; React Query hooks wrap these.
 */

import {
  EntryResponse,
  GameweeksResponse,
  HistoryResponse,
  LeaguesResponse,
  LeagueStandingsResponse,
  PlayerPoolResponse,
  SquadResponse,
  TeamOfTheWeekResponse,
  TeamPlayersResponse,
  TeamsResponse,
  TopPlayersGwResponse,
  TopPlayersSeasonResponse,
  TransfersResponse,
} from '@/types';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusCode: 'not-found' | 'unreachable' | 'error',
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiError(404, 'not-found', 'Not found');
      }
      throw new ApiError(response.status, 'error', `API error: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(0, 'unreachable', 'Network error');
  }
}

export const api = {
  getMe: () => request<{ id: string; email: string; name: string; fplTeamId: number | null }>('/me'),

  getGameweeks: () => request<GameweeksResponse>('/gameweeks'),

  getEntry: (teamId: number) => request<EntryResponse>(`/entry/${teamId}`),

  getSquad: (teamId: number, gameweek: number) =>
    request<SquadResponse>(`/squad/${teamId}/${gameweek}`),

  getHistory: (teamId: number) => request<HistoryResponse>(`/entry/${teamId}/history`),

  getLeagues: (teamId: number) => request<LeaguesResponse>(`/entry/${teamId}/leagues`),

  getTeamOfTheWeek: (gw: number) => request<TeamOfTheWeekResponse>(`/team-of-the-week/${gw}`),

  getTopPlayersGw: (gw: number) => request<TopPlayersGwResponse>(`/top-players/gameweek/${gw}`),

  getPlayersLive: (gw: number, ids: number[]) =>
    request<TopPlayersGwResponse>(`/players/live/${gw}?ids=${ids.join(',')}`),

  getTopPlayersSeason: () => request<TopPlayersSeasonResponse>('/top-players/season'),

  getTeams: () => request<TeamsResponse>('/teams'),

  getTeamPlayers: (teamCode: number) => request<TeamPlayersResponse>(`/team-players/${teamCode}`),

  getPlayerPool: () => request<PlayerPoolResponse>('/player-pool'),

  getTransfers: (teamId: number) => request<TransfersResponse>(`/entry/${teamId}/transfers`),

  getLeagueStandings: (leagueId: number, page: number) =>
    request<LeagueStandingsResponse>(`/leagues/${leagueId}/standings?page=${page}`),
};
