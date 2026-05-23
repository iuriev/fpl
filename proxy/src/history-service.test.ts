import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as historyService from './history-service';
import * as fplClient from './fpl-client';
import * as cache from './cache';

vi.mock('./fpl-client');
vi.mock('./cache');

const mockBootstrap = {
  total_players: 10000000,
  events: [
    { id: 1, name: 'Gameweek 1', deadline_time: '', is_current: false, finished: true, average_entry_score: 50, highest_score: 120 },
    { id: 2, name: 'Gameweek 2', deadline_time: '', is_current: true, finished: false, average_entry_score: 55, highest_score: 130 },
  ],
  teams: [],
  elements: [],
  element_types: [],
};

const mockFPLHistory = {
  current: [
    { event: 1, points: 65, total_points: 65, rank: 2000000, overall_rank: 2000000, value: 1000, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 8 },
    { event: 2, points: 72, total_points: 137, rank: 1500000, overall_rank: 1800000, value: 1020, event_transfers: 1, event_transfers_cost: 0, points_on_bench: 4 },
  ],
};

describe('History Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHistory', () => {
    it('fetches history and bootstrap, maps all fields, reverses array', async () => {
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getHistory as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockFPLHistory);
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

      const result = await historyService.getHistory(123);

      expect(result.teamId).toBe(123);
      expect(result.gameweeks).toHaveLength(2);
      expect(result.gameweeks[0].gw).toBe(2);
      expect(result.gameweeks[1].gw).toBe(1);
    });

    it('maps all fields correctly', async () => {
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getHistory as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockFPLHistory);
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

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
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getHistory as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockFPLHistory);
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

      const result = await historyService.getHistory(123);

      expect(result.gameweeks[1].teamValue).toBe(100);
    });

    it('caches with HISTORY_CURRENT TTL when current GW is not finished', async () => {
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getHistory as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockFPLHistory);
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);
      (cache.ttl as typeof cache.ttl) = { ...cache.ttl, HISTORY_CURRENT: 60, HISTORY_FINISHED: 86400 };

      await historyService.getHistory(123);

      expect(cache.set).toHaveBeenCalledWith('history:123', expect.any(Object), 60);
    });

    it('caches with HISTORY_FINISHED TTL when current GW is finished', async () => {
      const finishedBootstrap = {
        ...mockBootstrap,
        events: [
          { ...mockBootstrap.events[0] },
          { ...mockBootstrap.events[1], finished: true },
        ],
      };
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getHistory as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockFPLHistory);
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(finishedBootstrap);
      (cache.ttl as typeof cache.ttl) = { ...cache.ttl, HISTORY_CURRENT: 60, HISTORY_FINISHED: 86400 };

      await historyService.getHistory(123);

      expect(cache.set).toHaveBeenCalledWith('history:123', expect.any(Object), 86400);
    });

    it('returns cached result when available', async () => {
      const cached = { teamId: 123, gameweeks: [] };
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(cached);

      const result = await historyService.getHistory(123);

      expect(result).toEqual(cached);
      expect(fplClient.getHistory).not.toHaveBeenCalled();
    });

    it('handles empty history', async () => {
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getHistory as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ current: [] });
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

      const result = await historyService.getHistory(123);

      expect(result.gameweeks).toHaveLength(0);
    });

    it('propagates errors from FPL client', async () => {
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getHistory as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('FPL API error: 404 Not Found'),
      );
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

      await expect(historyService.getHistory(999999)).rejects.toThrow('FPL API error: 404 Not Found');
    });
  });
});
