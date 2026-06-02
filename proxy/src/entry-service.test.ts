import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as cache from './cache';
import * as entryService from './entry-service';
import * as fplClient from './fpl-client';

vi.mock('./fpl-client');
vi.mock('./cache');

const mockBootstrap = {
  total_players: 10000000,
  events: [],
  teams: [],
  elements: [],
  element_types: [],
};

const mockFPLEntry = {
  id: 123,
  name: 'My Team',
  player_first_name: 'John',
  player_last_name: 'Doe',
  summary_overall_points: 2156,
  summary_overall_rank: 50000,
  summary_event_points: 67,
  summary_event_rank: 234567,
  player_region_iso_code_short: 'UA',
};

describe('Entry Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEntry', () => {
    it('fetches entry and bootstrap, maps all fields', async () => {
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getEntry as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockFPLEntry);
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

      const result = await entryService.getEntry(123);

      expect(result).toEqual({
        teamId: 123,
        teamName: 'My Team',
        managerName: 'John Doe',
        overallPoints: 2156,
        overallRank: 50000,
        eventPoints: 67,
        eventRank: 234567,
        totalPlayers: 10000000,
        regionIsoCode: 'UA',
      });
      expect(cache.set).toHaveBeenCalledWith('entry:123', expect.any(Object), expect.any(Number));
    });

    it('returns cached entry when available', async () => {
      const cachedEntry = {
        teamId: 123,
        teamName: 'Cached Team',
        managerName: 'Cached Name',
        overallPoints: 1000,
        overallRank: 99999,
        eventPoints: 50,
        totalPlayers: 9000000,
      };
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(cachedEntry);

      const result = await entryService.getEntry(123);

      expect(result).toEqual(cachedEntry);
      expect(fplClient.getEntry).not.toHaveBeenCalled();
      expect(fplClient.getBootstrapStatic).not.toHaveBeenCalled();
    });

    it('uses cached bootstrap-static when available', async () => {
      (cache.get as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(mockBootstrap);
      (fplClient.getEntry as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockFPLEntry);

      await entryService.getEntry(123);

      expect(fplClient.getBootstrapStatic).not.toHaveBeenCalled();
    });

    it('omits regionIsoCode when region code is null', async () => {
      const entryNoRegion = { ...mockFPLEntry, player_region_iso_code_short: null };
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getEntry as ReturnType<typeof vi.fn>).mockResolvedValueOnce(entryNoRegion);
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

      const result = await entryService.getEntry(123);

      expect(result.regionIsoCode).toBeUndefined();
    });

    it('concatenates first and last name correctly', async () => {
      const entry = { ...mockFPLEntry, id: 456, name: 'Test Squad', player_first_name: 'Jane', player_last_name: 'Smith' };
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getEntry as ReturnType<typeof vi.fn>).mockResolvedValueOnce(entry);
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

      const result = await entryService.getEntry(456);

      expect(result.managerName).toBe('Jane Smith');
    });

    it('propagates errors from FPL client', async () => {
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getEntry as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('FPL API error: 404 Not Found'),
      );
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

      await expect(entryService.getEntry(999999)).rejects.toThrow(
        'FPL API error: 404 Not Found',
      );
    });
  });
});
