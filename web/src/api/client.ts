/**
 * API client for the proxy endpoints.
 * Direct async functions; React Query hooks wrap these.
 */

import { EntryResponse, GameweeksResponse, HistoryResponse, SquadResponse } from '@/types';

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
  getGameweeks: () => request<GameweeksResponse>('/gameweeks'),

  getEntry: (teamId: number) => request<EntryResponse>(`/entry/${teamId}`),

  getSquad: (teamId: number, gameweek: number) =>
    request<SquadResponse>(`/squad/${teamId}/${gameweek}`),

  getHistory: (teamId: number) => request<HistoryResponse>(`/entry/${teamId}/history`),
};
