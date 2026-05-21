import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as entryService from './entry-service';
import * as fplClient from './fpl-client';
import * as cache from './cache';

vi.mock('./fpl-client');
vi.mock('./cache');

describe('Entry Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEntry', () => {
    it('fetches and caches entry data', async () => {
      const mockEntry = {
        id: 123,
        name: 'My Team',
        player_first_name: 'John',
        player_last_name: 'Doe',
        summary_overall_rank: 50000,
      };

      (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);
      (fplClient.getEntry as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockEntry);

      const result = await entryService.getEntry(123);

      expect(result).toEqual({
        teamId: 123,
        teamName: 'My Team',
        managerName: 'John Doe',
      });
      expect(cache.set).toHaveBeenCalledWith('entry:123', expect.any(Object), 3600);
    });

    it('returns cached entry when available', async () => {
      const cachedEntry = {
        teamId: 123,
        teamName: 'Cached Team',
        managerName: 'Cached Name',
      };

      (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(cachedEntry);

      const result = await entryService.getEntry(123);

      expect(result).toEqual(cachedEntry);
      expect(fplClient.getEntry).not.toHaveBeenCalled();
    });

    it('concatenates first and last name correctly', async () => {
      const mockEntry = {
        id: 456,
        name: 'Test Squad',
        player_first_name: 'Jane',
        player_last_name: 'Smith',
        summary_overall_rank: 100000,
      };

      (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);
      (fplClient.getEntry as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockEntry);

      const result = await entryService.getEntry(456);

      expect(result.managerName).toBe('Jane Smith');
    });

    it('propagates errors from FPL client', async () => {
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);
      (fplClient.getEntry as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('FPL API error: 404 Not Found'),
      );

      await expect(entryService.getEntry(999999)).rejects.toThrow(
        'FPL API error: 404 Not Found',
      );
    });
  });
});
