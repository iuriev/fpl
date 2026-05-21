/**
 * React Query hooks for API endpoints.
 */

import { useQuery } from '@tanstack/react-query';

import { api } from './client';

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
    staleTime: 1000 * 60, // 1 minute for now; TODO: 24h for finished GW
    retry: true,
  });
}
