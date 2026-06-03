import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as dbCache from './fpl-cache/db-cache';
import * as historyService from './history-service';

vi.mock('./db/client', () => ({ db: {} }));
vi.mock('./fpl-cache/db-cache');

const mockBootstrap = {
  total_players: 10000000,
  events: [
    { id: 1, name: 'Gameweek 1', deadline_time: '2025-08-09T11:00:00Z', is_current: false, is_next: false, finished: true, data_checked: true, average_entry_score: 50, highest_score: 120 },
    { id: 2, name: 'Gameweek 2', deadline_time: '2025-08-16T11:00:00Z', is_current: true, is_next: false, finished: false, data_checked: false, average_entry_score: 55, highest_score: 130 },
  ],
  teams: [],
  elements: [],
  element_types: [],
  chips: [],
};

const mockFPLHistory = {
  current: [
    { event: 1, points: 65, total_points: 65, rank: 2000000, overall_rank: 2000000, value: 1000, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 8 },
    { event: 2, points: 72, total_points: 137, rank: 1500000, overall_rank: 1800000, value: 1020, event_transfers: 1, event_transfers_cost: 0, points_on_bench: 4 },
  ],
  chips: [],
};

describe('History Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValue(mockBootstrap as never);
    vi.mocked(dbCache.getSeasonMeta).mockResolvedValue({ isComplete: false });
    vi.mocked(dbCache.getOrFetchHistory).mockResolvedValue(mockFPLHistory as never);
  });

  describe('getHistory', () => {
    it('fetches history and maps all fields, reversing the array', async () => {
      const result = await historyService.getHistory(123);

      expect(result.teamId).toBe(123);
      expect(result.gameweeks).toHaveLength(2);
      expect(result.gameweeks[0].gw).toBe(2);
      expect(result.gameweeks[1].gw).toBe(1);
    });

    it('maps all fields correctly', async () => {
      const result = await historyService.getHistory(123);
      const gw2 = result.gameweeks[0];

      expect(gw2).toEqual({
        gw: 2,
        overallRank: 1800000,
        overallPoints: 137,
        gwRank: 1500000,
        gwPoints: 72,
        pointsOnBench: 4,
        transfers: 1,
        transferCost: 0,
        teamValue: 102,
      });
    });

    it('divides value by 10 for teamValue', async () => {
      const result = await historyService.getHistory(123);

      expect(result.gameweeks[1].teamValue).toBe(100);
    });

    it('handles empty history', async () => {
      vi.mocked(dbCache.getOrFetchHistory).mockResolvedValueOnce({ current: [], chips: [] } as never);

      const result = await historyService.getHistory(123);

      expect(result.gameweeks).toHaveLength(0);
    });

    it('propagates errors from the cache layer', async () => {
      vi.mocked(dbCache.getOrFetchHistory).mockRejectedValueOnce(
        new Error('FPL API error: 404 Not Found'),
      );

      await expect(historyService.getHistory(999999)).rejects.toThrow(
        'FPL API error: 404 Not Found',
      );
    });
  });
});
