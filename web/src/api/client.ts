/**
 * API client for the proxy endpoints.
 * Direct async functions; React Query hooks wrap these.
 */

import { GameweeksResponse, EntryResponse, SquadResponse } from '@/types';

const API_BASE = '/api';

async function request<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  getGameweeks: () => request<GameweeksResponse>('/gameweeks'),

  getEntry: (teamId: number) =>
    request<EntryResponse>(`/entry/${teamId}`).catch((err) => {
      // Return a structured error that the hook can handle
      throw {
        status: 'not-found' as const,
        message: 'Team not found',
        originalError: err,
      };
    }),

  getSquad: (teamId: number, gameweek: number) =>
    request<SquadResponse>(`/squad/${teamId}/${gameweek}`),
};
