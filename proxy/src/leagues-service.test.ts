import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as cache from './cache';
import * as fplClient from './fpl-client';
import * as leaguesService from './leagues-service';

vi.mock('./fpl-client');
vi.mock('./cache');

const mockFPLEntry = {
  id: 123,
  name: 'Test FC',
  player_first_name: 'John',
  player_last_name: 'Doe',
  summary_overall_points: 1500,
  summary_overall_rank: 1000000,
  summary_event_points: 65,
  player_region_iso_code_short: 'GB',
  leagues: {
    classic: [
      { id: 1, name: 'Overall', entry_rank: 1000000, entry_last_rank: 1100000 },
      { id: 100, name: 'My Private League', entry_rank: 5, entry_last_rank: 3 },
    ],
    h2h: [{ id: 200, name: 'H2H League', entry_rank: 2, entry_last_rank: null }],
  },
};

describe('Leagues Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLeagues', () => {
    it('fetches entry and maps classic and h2h leagues', async () => {
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getEntry as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockFPLEntry);

      const result = await leaguesService.getLeagues(123);

      expect(result.teamId).toBe(123);
      expect(result.classic).toHaveLength(2);
      expect(result.h2h).toHaveLength(1);
    });

    it('maps classic league fields correctly', async () => {
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getEntry as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockFPLEntry);

      const result = await leaguesService.getLeagues(123);

      expect(result.classic[0]).toEqual({
        id: 1,
        name: 'Overall',
        rank: 1000000,
        lastRank: 1100000,
      });
      expect(result.classic[1]).toEqual({
        id: 100,
        name: 'My Private League',
        rank: 5,
        lastRank: 3,
      });
    });

    it('maps h2h league with null lastRank', async () => {
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getEntry as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockFPLEntry);

      const result = await leaguesService.getLeagues(123);

      expect(result.h2h[0]).toEqual({ id: 200, name: 'H2H League', rank: 2, lastRank: null });
    });

    it('caches result with ENTRY TTL', async () => {
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getEntry as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockFPLEntry);
      (cache.ttl as typeof cache.ttl) = { ...cache.ttl, ENTRY: 3600 };

      await leaguesService.getLeagues(123);

      expect(cache.set).toHaveBeenCalledWith('leagues:123', expect.any(Object), 3600);
    });

    it('returns cached result when available', async () => {
      const cached = { teamId: 123, classic: [], h2h: [] };
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(cached);

      const result = await leaguesService.getLeagues(123);

      expect(result).toEqual(cached);
      expect(fplClient.getEntry).not.toHaveBeenCalled();
    });

    it('handles empty classic and h2h arrays', async () => {
      const emptyEntry = { ...mockFPLEntry, leagues: { classic: [], h2h: [] } };
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getEntry as ReturnType<typeof vi.fn>).mockResolvedValueOnce(emptyEntry);

      const result = await leaguesService.getLeagues(123);

      expect(result.classic).toHaveLength(0);
      expect(result.h2h).toHaveLength(0);
    });

    it('propagates errors from FPL client', async () => {
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getEntry as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('FPL API error: 404 Not Found')
      );

      await expect(leaguesService.getLeagues(999999)).rejects.toThrow(
        'FPL API error: 404 Not Found'
      );
    });
  });
});
