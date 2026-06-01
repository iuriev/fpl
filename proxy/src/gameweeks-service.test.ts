import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as cache from './cache';
import * as fplClient from './fpl-client';
import * as gameweeksService from './gameweeks-service';

vi.mock('./fpl-client');
vi.mock('./cache');

describe('Gameweeks Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGameweeks', () => {
    it('returns current gameweek when flagged', async () => {
      const mockBootstrap = {
        events: [
          {
            id: 1,
            name: 'Gameweek 1',
            finished: true,
            is_current: false,
            average_entry_score: 50,
            highest_score: 100,
            deadline_time: '2025-01-01T12:00:00Z',
          },
          {
            id: 2,
            name: 'Gameweek 2',
            finished: false,
            is_current: true,
            average_entry_score: 52,
            highest_score: 105,
            deadline_time: '2025-01-08T12:00:00Z',
          },
        ],
        teams: [],
        elements: [],
        element_types: [],
      };

      (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockBootstrap,
      );

      const result = await gameweeksService.getGameweeks();

      expect(result.current).toBe(2);
      expect(result.gameweeks).toHaveLength(2);
      expect(result.gameweeks[0]).toEqual({
        id: 1,
        name: 'Gameweek 1',
        finished: true,
        averageScore: 50,
        highestScore: 100,
      });
    });

    it('falls back to latest finished gameweek in off-season', async () => {
      const mockBootstrap = {
        events: [
          {
            id: 1,
            name: 'Gameweek 1',
            finished: true,
            is_current: false,
            average_entry_score: 50,
            highest_score: 100,
            deadline_time: '2025-01-01T12:00:00Z',
          },
          {
            id: 2,
            name: 'Gameweek 2',
            finished: true,
            is_current: false,
            average_entry_score: 52,
            highest_score: 105,
            deadline_time: '2025-01-08T12:00:00Z',
          },
          {
            id: 3,
            name: 'Gameweek 3',
            finished: false,
            is_current: false,
            average_entry_score: 0,
            highest_score: 0,
            deadline_time: '2025-01-15T12:00:00Z',
          },
        ],
        teams: [],
        elements: [],
        element_types: [],
      };

      (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockBootstrap,
      );

      const result = await gameweeksService.getGameweeks();

      expect(result.current).toBe(2);
    });

    it('defaults to 1 if no finished gameweeks', async () => {
      const mockBootstrap = {
        events: [
          {
            id: 1,
            name: 'Gameweek 1',
            finished: false,
            is_current: false,
            average_entry_score: 0,
            highest_score: 0,
            deadline_time: '2025-01-01T12:00:00Z',
          },
        ],
        teams: [],
        elements: [],
        element_types: [],
      };

      (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockBootstrap,
      );

      const result = await gameweeksService.getGameweeks();

      expect(result.current).toBe(1);
    });

    it('respects cached bootstrap data', async () => {
      const mockBootstrap = {
        events: [
          {
            id: 1,
            name: 'Gameweek 1',
            finished: false,
            is_current: true,
            average_entry_score: 50,
            highest_score: 100,
            deadline_time: '2025-01-01T12:00:00Z',
          },
        ],
        teams: [],
        elements: [],
        element_types: [],
      };

      (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(mockBootstrap);

      await gameweeksService.getGameweeks();

      expect(fplClient.getBootstrapStatic).not.toHaveBeenCalled();
    });
  });
});
