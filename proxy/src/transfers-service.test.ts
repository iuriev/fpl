import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as dbCache from './fpl-cache/db-cache';
import * as transfersService from './transfers-service';

vi.mock('./db/client', () => ({ db: {} }));
vi.mock('./fpl-cache/db-cache');

const mockBootstrap = {
  total_players: 10000000,
  events: [{ id: 1, name: 'Gameweek 1', deadline_time: '2025-08-09T11:00:00Z', is_current: true, is_next: false, finished: false, data_checked: false, average_entry_score: 0, highest_score: 0 }],
  teams: [],
  elements: [
    { id: 301, web_name: 'Salah', team: 14, team_code: 31, element_type: 3, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 200, first_name: 'Mohamed', second_name: 'Salah', now_cost: 130, event_points: 12, form: '8.0', selected_by_percent: '50.0', ep_next: '8.5', cost_change_event: 0, cost_change_start: 0, transfers_in_event: 0, transfers_out_event: 0, price_change_percent: '0.0' },
    { id: 302, web_name: 'Haaland', team: 11, team_code: 43, element_type: 4, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 180, first_name: 'Erling', second_name: 'Haaland', now_cost: 140, event_points: 8, form: '7.0', selected_by_percent: '60.0', ep_next: '7.5', cost_change_event: 0, cost_change_start: 0, transfers_in_event: 0, transfers_out_event: 0, price_change_percent: '0.0' },
    { id: 303, web_name: 'Saka', team: 1, team_code: 3, element_type: 3, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 150, first_name: 'Bukayo', second_name: 'Saka', now_cost: 95, event_points: 6, form: '5.5', selected_by_percent: '30.0', ep_next: '6.0', cost_change_event: 0, cost_change_start: 0, transfers_in_event: 0, transfers_out_event: 0, price_change_percent: '0.0' },
  ],
  element_types: [],
  chips: [],
};

const mockFPLTransfers = [
  { element_in: 301, element_out: 303, element_in_cost: 130, element_out_cost: 95, entry: 123, event: 37, time: '2025-04-28T10:00:00Z' },
  { element_in: 302, element_out: 303, element_in_cost: 140, element_out_cost: 95, entry: 123, event: 36, time: '2025-04-20T11:00:00Z' },
];

describe('Transfers Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValue(mockBootstrap as never);
    vi.mocked(dbCache.getSeasonMeta).mockResolvedValue({ isComplete: false });
    vi.mocked(dbCache.getOrFetchTransfers).mockResolvedValue(mockFPLTransfers as never);
  });

  it('fetches transfers and resolves player names from bootstrap', async () => {
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
    vi.mocked(dbCache.getOrFetchTransfers).mockResolvedValueOnce([
      { element_in: 9999, element_out: 8888, element_in_cost: 50, element_out_cost: 50, entry: 123, event: 37, time: '2025-04-28T10:00:00Z' },
    ] as never);

    const result = await transfersService.getTransfers(123);

    expect(result.transfers[0].elementInName).toBe('9999');
    expect(result.transfers[0].elementOutName).toBe('8888');
  });

  it('returns empty transfers array when team has no transfers', async () => {
    vi.mocked(dbCache.getOrFetchTransfers).mockResolvedValueOnce([] as never);

    const result = await transfersService.getTransfers(123);

    expect(result.transfers).toHaveLength(0);
  });

  it('propagates errors from the cache layer', async () => {
    vi.mocked(dbCache.getOrFetchTransfers).mockRejectedValueOnce(
      new Error('FPL API error: 404 Not Found'),
    );

    await expect(transfersService.getTransfers(999)).rejects.toThrow('404');
  });
});
