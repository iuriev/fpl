import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as dbCache from './fpl-cache/db-cache';
import * as gameweeksService from './gameweeks-service';

vi.mock('./db/client', () => ({ db: {} }));
vi.mock('./fpl-cache/db-cache');

describe('Gameweeks Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGameweeks', () => {
    function makeBootstrap(eventOverrides: object[]) {
      return {
        events: eventOverrides,
        teams: [],
        elements: [],
        element_types: [],
        chips: [],
        total_players: 0,
      };
    }

    it('returns current gameweek when flagged', async () => {
      const mockBootstrap = makeBootstrap([
        { id: 1, name: 'Gameweek 1', finished: true, is_current: false, is_next: false, average_entry_score: 50, highest_score: 100, deadline_time: '2025-08-09T11:00:00Z', data_checked: true },
        { id: 2, name: 'Gameweek 2', finished: false, is_current: true, is_next: false, average_entry_score: 52, highest_score: 105, deadline_time: '2025-08-16T11:00:00Z', data_checked: false },
      ]);
      vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValueOnce(mockBootstrap as never);

      const result = await gameweeksService.getGameweeks();

      expect(result.current).toBe(2);
      expect(result.next).toBe(3);
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
      const mockBootstrap = makeBootstrap([
        { id: 1, name: 'Gameweek 1', finished: true, is_current: false, is_next: false, average_entry_score: 50, highest_score: 100, deadline_time: '2025-08-09T11:00:00Z', data_checked: true },
        { id: 2, name: 'Gameweek 2', finished: true, is_current: false, is_next: false, average_entry_score: 52, highest_score: 105, deadline_time: '2025-08-16T11:00:00Z', data_checked: true },
        { id: 3, name: 'Gameweek 3', finished: false, is_current: false, is_next: true, average_entry_score: 0, highest_score: 0, deadline_time: '2025-08-23T11:00:00Z', data_checked: false },
      ]);
      vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValueOnce(mockBootstrap as never);

      const result = await gameweeksService.getGameweeks();

      expect(result.current).toBe(2);
    });

    it('defaults to 1 if no finished gameweeks', async () => {
      const mockBootstrap = makeBootstrap([
        { id: 1, name: 'Gameweek 1', finished: false, is_current: false, is_next: true, average_entry_score: 0, highest_score: 0, deadline_time: '2025-08-09T11:00:00Z', data_checked: false },
      ]);
      vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValueOnce(mockBootstrap as never);

      const result = await gameweeksService.getGameweeks();

      expect(result.current).toBe(1);
      expect(result.next).toBe(1);
    });

    it('caps next at 38 when current is the last gameweek', async () => {
      const mockBootstrap = makeBootstrap([
        { id: 37, name: 'Gameweek 37', finished: true, is_current: false, is_next: false, average_entry_score: 50, highest_score: 100, deadline_time: '2025-05-01T11:00:00Z', data_checked: true },
        { id: 38, name: 'Gameweek 38', finished: false, is_current: true, is_next: false, average_entry_score: 0, highest_score: 0, deadline_time: '2025-05-08T11:00:00Z', data_checked: false },
      ]);
      vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValueOnce(mockBootstrap as never);

      const result = await gameweeksService.getGameweeks();

      expect(result.current).toBe(38);
      expect(result.next).toBe(38);
    });
  });
});
