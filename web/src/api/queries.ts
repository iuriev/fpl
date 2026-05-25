import { useQuery } from '@tanstack/react-query';

import { api,ApiError } from './client';

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

export function useDreamTeam(gameweek: number | null) {
  return useQuery({
    queryKey: ['dream-team', gameweek],
    queryFn: () => {
      if (gameweek === null) throw new Error('Gameweek required');
      return api.getDreamTeam(gameweek);
    },
    enabled: gameweek !== null,
    staleTime: 1000 * 60 * 60 * 24, // 24h — finished GW data is immutable
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

export function useSquad(teamId: number | null, gameweek: number | null) {
  return useQuery({
    queryKey: ['squad', teamId, gameweek],
    queryFn: () => {
      if (!teamId || gameweek === null) throw new Error('Team ID and gameweek required');
      return api.getSquad(teamId, gameweek);
    },
    enabled: !!teamId && gameweek !== null,
    staleTime: 1000 * 60,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 3;
    },
  });
}
