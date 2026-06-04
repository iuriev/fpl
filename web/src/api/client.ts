/**
 * API client for the proxy endpoints.
 * Direct async functions; React Query hooks wrap these.
 */

import {
  CalendarResponse,
  EntryResponse,
  GameweeksResponse,
  HistoryResponse,
  LeaderboardGwResponse,
  LeaderboardSeasonResponse,
  LeaguesResponse,
  LeagueStandingsResponse,
  PlayerPoolResponse,
  PlayerProfileResponse,
  PositionFilter,
  PriceChangeDirection,
  PriceChangePeriod,
  PriceChangesResponse,
  PricePredictionDirection,
  PricePredictionsResponse,
  SquadResponse,
  SubscriptionTier,
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

async function request<T>(endpoint: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: init?.credentials ?? 'same-origin',
      ...init,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiError(404, 'not-found', 'Not found');
      }
      if (response.status === 403) {
        throw new ApiError(403, 'error', 'premium_required');
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

function priceQuery(
  params: Record<string, string>
): string {
  return new URLSearchParams(params).toString();
}

export const api = {
  getMe: () =>
    request<{
      id: string;
      email: string;
      name: string;
      fplTeamId: number | null;
      emailVerified: boolean;
      subscriptionTier: SubscriptionTier;
    }>('/me'),

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

  getPriceChanges: (
    period: PriceChangePeriod,
    direction: PriceChangeDirection,
    position: PositionFilter
  ) =>
    request<PriceChangesResponse>(
      `/price-changes?${priceQuery({ period, direction, position })}`
    ),

  getPriceChangesSquad: (
    period: PriceChangePeriod,
    direction: PriceChangeDirection,
    position: PositionFilter
  ) =>
    request<PriceChangesResponse>(
      `/price-changes/squad?${priceQuery({ period, direction, position })}`,
      { credentials: 'include' }
    ),

  getPricePredictions: (direction: PricePredictionDirection, position: PositionFilter) =>
    request<PricePredictionsResponse>(
      `/price-predictions?${priceQuery({ direction, position })}`
    ),

  getPricePredictionsSquad: (direction: PricePredictionDirection, position: PositionFilter) =>
    request<PricePredictionsResponse>(
      `/price-predictions/squad?${priceQuery({ direction, position })}`,
      { credentials: 'include' }
    ),

  getPlayerProfile: (playerId: number, gw?: number) =>
    request<PlayerProfileResponse>(
      gw != null ? `/players/${playerId}/profile?gw=${gw}` : `/players/${playerId}/profile`
    ),

  getLeaderboardGw: (gw: number) => request<LeaderboardGwResponse>(`/leaderboard/gw/${gw}`),

  getLeaderboardSeason: () => request<LeaderboardSeasonResponse>('/leaderboard/season'),

  getFixturesCalendar: () => request<CalendarResponse>('/fixtures/calendar'),
};
