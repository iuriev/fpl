import { useQuery } from '@tanstack/react-query';

import { ApiError, api } from './client';

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
