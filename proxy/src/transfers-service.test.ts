import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as cache from './cache';
import * as fplClient from './fpl-client';
import * as transfersService from './transfers-service';

vi.mock('./fpl-client');
vi.mock('./cache');

const mockBootstrap = {
  total_players: 10000000,
  events: [],
  teams: [],
  elements: [
    { id: 301, web_name: 'Salah', team: 14, team_code: 31, element_type: 3, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 200, first_name: 'Mohamed', second_name: 'Salah', now_cost: 130, event_points: 12, form: '8.0', selected_by_percent: '50.0', ep_next: '8.5' },
    { id: 302, web_name: 'Haaland', team: 11, team_code: 43, element_type: 4, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 180, first_name: 'Erling', second_name: 'Haaland', now_cost: 140, event_points: 8, form: '7.0', selected_by_percent: '60.0', ep_next: '7.5' },
    { id: 303, web_name: 'Saka', team: 1, team_code: 3, element_type: 3, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 150, first_name: 'Bukayo', second_name: 'Saka', now_cost: 95, event_points: 6, form: '5.5', selected_by_percent: '30.0', ep_next: '6.0' },
  ],
  element_types: [],
  chips: [],
};

const mockTransfers = [
  { element_in: 301, element_out: 303, element_in_cost: 130, element_out_cost: 95, entry: 123, event: 37, time: '2025-04-28T10:00:00Z' },
  { element_in: 302, element_out: 303, element_in_cost: 140, element_out_cost: 95, entry: 123, event: 36, time: '2025-04-20T11:00:00Z' },
];

describe('Transfers Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches transfers and resolves player names from bootstrap', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getTransfers as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTransfers);
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

    const result = await transfersService.getTransfers(123);

    expect(result.teamId).toBe(123);
    expect(result.transfers).toHaveLength(2);
    expect(result.transfers[0]).toEqual({
      event: 37,
      elementIn: 301,
      elementInName: 'Salah',
      elementOut: 303,
      elementOutName: 'Saka',
      elementInCost: 130,
      elementOutCost: 95,
      time: '2025-04-28T10:00:00Z',
    });
  });

  it('falls back to player id string when player not in bootstrap', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getTransfers as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { element_in: 9999, element_out: 8888, element_in_cost: 50, element_out_cost: 50, entry: 123, event: 37, time: '2025-04-28T10:00:00Z' },
    ]);
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

    const result = await transfersService.getTransfers(123);

    expect(result.transfers[0].elementInName).toBe('9999');
    expect(result.transfers[0].elementOutName).toBe('8888');
  });

  it('returns empty transfers array when team has no transfers', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getTransfers as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

    const result = await transfersService.getTransfers(123);

    expect(result.transfers).toHaveLength(0);
  });

  it('returns cached result when available', async () => {
    const cached = { teamId: 123, transfers: [] };
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(cached);

    const result = await transfersService.getTransfers(123);

    expect(result).toEqual(cached);
    expect(fplClient.getTransfers).not.toHaveBeenCalled();
  });

  it('uses cached bootstrap when available', async () => {
    (cache.get as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(mockBootstrap);
    (fplClient.getTransfers as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    await transfersService.getTransfers(123);

    expect(fplClient.getBootstrapStatic).not.toHaveBeenCalled();
  });

  it('propagates 404 errors', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getTransfers as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('FPL API error: 404 Not Found'),
    );
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

    await expect(transfersService.getTransfers(999)).rejects.toThrow('404');
  });
});
