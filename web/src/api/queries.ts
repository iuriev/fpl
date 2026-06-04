import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import type {
  LeaderboardGwResponse,
  LeaderboardSeasonResponse,
  PositionFilter,
  PriceChangeDirection,
  PriceChangePeriod,
  PricePredictionDirection,
} from '@/types';

import { api, ApiError } from './client';

export function useGameweeks() {
  return useQuery({
    queryKey: ['gameweeks'],
    queryFn: () => api.getGameweeks(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useEntry(teamId: number | null) {
  return useQuery({
    queryKey: ['entry', teamId],
    queryFn: () => {
      if (!teamId) throw new Error('Team ID required');
      return api.getEntry(teamId);
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: false,
  });
}

export function useHistory(teamId: number | null) {
  return useQuery({
    queryKey: ['history', teamId],
    queryFn: () => {
      if (!teamId) throw new Error('Team ID required');
      return api.getHistory(teamId);
    },
    enabled: !!teamId,
    staleTime: 1000 * 60,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 3;
    },
  });
}

export function useLeagues(teamId: number | null) {
  return useQuery({
    queryKey: ['leagues', teamId],
    queryFn: () => {
      if (!teamId) throw new Error('Team ID required');
      return api.getLeagues(teamId);
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 3;
    },
  });
}

export function useTeamOfTheWeek(gameweek: number | null) {
  return useQuery({
    queryKey: ['dream-team', gameweek],
    queryFn: () => {
      if (gameweek === null) throw new Error('Gameweek required');
      return api.getTeamOfTheWeek(gameweek);
    },
    enabled: gameweek !== null,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 60 * 24, // 24h — finished GW data is immutable
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 400 || error.status === 404)) return false;
      return failureCount < 3;
    },
  });
}

export function usePlayersLive(gameweek: number | null, ids: number[]) {
  return useQuery({
    queryKey: ['players-live', gameweek, ids],
    queryFn: () => {
      if (gameweek === null) throw new Error('Gameweek required');
      return api.getPlayersLive(gameweek, ids);
    },
    enabled: gameweek !== null && ids.length > 0,
    staleTime: 1000 * 60,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 400 || error.status === 404)) return false;
      return failureCount < 3;
    },
  });
}

export function useTopPlayersGw(gameweek: number | null) {
  return useQuery({
    queryKey: ['top-players-gw', gameweek],
    queryFn: () => {
      if (gameweek === null) throw new Error('Gameweek required');
      return api.getTopPlayersGw(gameweek);
    },
    enabled: gameweek !== null,
    staleTime: 1000 * 60,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 400 || error.status === 404)) return false;
      return failureCount < 3;
    },
  });
}

export function useTopPlayersSeason() {
  return useQuery({
    queryKey: ['top-players-season'],
    queryFn: () => api.getTopPlayersSeason(),
    staleTime: 1000 * 60 * 60,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 400 || error.status === 404)) return false;
      return failureCount < 3;
    },
  });
}

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => api.getTeams(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useTeamPlayers(teamCode: number | null) {
  return useQuery({
    queryKey: ['team-players', teamCode],
    queryFn: () => {
      if (teamCode === null) throw new Error('Team code required');
      return api.getTeamPlayers(teamCode);
    },
    enabled: teamCode !== null,
    staleTime: 1000 * 60 * 60,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 3;
    },
  });
}

export function usePlayerPool() {
  return useQuery({
    queryKey: ['player-pool'],
    queryFn: () => api.getPlayerPool(),
    staleTime: 1000 * 60 * 10,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 3;
    },
  });
}

export function useTransfers(teamId: number | null) {
  return useQuery({
    queryKey: ['transfers', teamId],
    queryFn: () => {
      if (!teamId) throw new Error('Team ID required');
      return api.getTransfers(teamId);
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 60,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 3;
    },
  });
}

export function useLeagueStandings(leagueId: number | null) {
  return useInfiniteQuery({
    queryKey: ['league-standings', leagueId],
    queryFn: ({ pageParam }) => {
      if (!leagueId) throw new Error('League ID required');
      return api.getLeagueStandings(leagueId, pageParam);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasNext ? lastPageParam + 1 : undefined,
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 10,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 3;
    },
  });
}

export function useSquad(teamId: number | null, gameweek: number | null) {
  return useQuery({
    queryKey: ['squad', teamId, gameweek],
    queryFn: () => {
      if (!teamId || gameweek === null) throw new Error('Team ID and gameweek required');
      return api.getSquad(teamId, gameweek);
    },
    enabled: !!teamId && gameweek !== null,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 3;
    },
  });
}

export function usePriceChanges(
  period: PriceChangePeriod,
  direction: PriceChangeDirection,
  position: PositionFilter,
  squad: boolean,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['price-changes', period, direction, position, squad],
    queryFn: () =>
      squad
        ? api.getPriceChangesSquad(period, direction, position)
        : api.getPriceChanges(period, direction, position),
    enabled,
    staleTime: 1000 * 60 * 10,
  });
}

export function usePricePredictions(
  direction: PricePredictionDirection,
  position: PositionFilter,
  squad: boolean,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['price-predictions', direction, position, squad],
    queryFn: () =>
      squad
        ? api.getPricePredictionsSquad(direction, position)
        : api.getPricePredictions(direction, position),
    enabled,
    staleTime: 1000 * 60 * 10,
  });
}

export function usePlayerProfile(playerId: number | null) {
  return useQuery({
    queryKey: ['player-profile', playerId],
    queryFn: () => {
      if (!playerId) throw new Error('Player ID required');
      return api.getPlayerProfile(playerId);
    },
    enabled: playerId != null,
    staleTime: 1000 * 60 * 10,
  });
}

export function useLeaderboardGw(gw: number | null) {
  return useQuery({
    queryKey: ['leaderboard-gw', gw],
    queryFn: () => {
      if (gw === null) throw new Error('Gameweek required');
      return api.getLeaderboardGw(gw);
    },
    enabled: gw !== null,
    staleTime: 1000 * 60 * 60,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 400 || error.status === 404)) return false;
      return failureCount < 3;
    },
  });
}

export function useLeaderboardSeason() {
  return useQuery({
    queryKey: ['leaderboard-season'],
    queryFn: () => api.getLeaderboardSeason(),
    staleTime: 1000 * 60 * 30,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 400 || error.status === 404)) return false;
      return failureCount < 3;
    },
  });
}

export function useFixturesCalendar() {
  return useQuery({
    queryKey: ['fixtures-calendar'],
    queryFn: () => api.getFixturesCalendar(),
    staleTime: 1000 * 60 * 60 * 12,
  });
}

export function usePredictedLineups(gw: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ['predicted-lineups', gw],
    queryFn: () => api.getPredictedLineups(gw ?? undefined),
    enabled: enabled && gw !== null,
    staleTime: 1000 * 60 * 10,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 403) return false;
      return failureCount < 2;
    },
  });
}
