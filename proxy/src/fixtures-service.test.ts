import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fixturesService from './fixtures-service';
import * as fplClient from './fpl-client';
import type { FPLBootstrapStatic, FPLFixture } from './fpl-client';
import * as cache from './cache';

vi.mock('./fpl-client');
vi.mock('./cache');

const mockBootstrap = {
  total_players: 10000000,
  events: [
    { id: 1, name: 'GW1', finished: true,  is_current: false, is_next: false,
      deadline_time: '', average_entry_score: 50, highest_score: 100 },
    { id: 2, name: 'GW2', finished: false, is_current: true,  is_next: false,
      deadline_time: '', average_entry_score: 50, highest_score: 100 },
    { id: 3, name: 'GW3', finished: false, is_current: false, is_next: true,
      deadline_time: '', average_entry_score: 0,  highest_score: 0 },
    { id: 4, name: 'GW4', finished: false, is_current: false, is_next: false,
      deadline_time: '', average_entry_score: 0,  highest_score: 0 },
    { id: 5, name: 'GW5', finished: false, is_current: false, is_next: false,
      deadline_time: '', average_entry_score: 0,  highest_score: 0 },
  ],
  teams: [
    { id: 1,  name: 'Arsenal',  short_name: 'ARS', code: 3 },
    { id: 14, name: 'Man City', short_name: 'MCI', code: 43 },
  ],
  elements: [],
  element_types: [],
};

const mockFixtures = [
  { id: 1, event: 3, team_h: 1, team_a: 14,
    team_h_difficulty: 4, team_a_difficulty: 2,
    kickoff_time: '2025-09-01T15:00:00Z', finished: false },
];

describe('fixtures-service', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getUpcomingFixtures', () => {
    it('fetches next 3 GWs and builds per-team fixture lookup', async () => {
      vi.mocked(cache.get).mockReturnValue(null);
      vi.mocked(cache.set).mockReturnValue(undefined);
      vi.mocked(fplClient.getBootstrapStatic).mockResolvedValue(mockBootstrap as unknown as FPLBootstrapStatic);
      vi.mocked(fplClient.getFixtures).mockResolvedValue(mockFixtures as unknown as FPLFixture[]);

      const result = await fixturesService.getUpcomingFixtures();

      expect(fplClient.getFixtures).toHaveBeenCalledWith(3);
      expect(fplClient.getFixtures).toHaveBeenCalledWith(4);
      expect(fplClient.getFixtures).toHaveBeenCalledWith(5);

      expect(result[1]).toContainEqual(
        { gw: 3, opponent: 'MCI', home: true, difficulty: 4 }
      );
      expect(result[14]).toContainEqual(
        { gw: 3, opponent: 'ARS', home: false, difficulty: 2 }
      );
    });

    it('returns cached result without calling FPL', async () => {
      const cached = { 1: [{ gw: 3, opponent: 'MCI', home: true, difficulty: 4 }] };
      vi.mocked(cache.get).mockReturnValue(cached);

      const result = await fixturesService.getUpcomingFixtures();

      expect(fplClient.getBootstrapStatic).not.toHaveBeenCalled();
      expect(result).toEqual(cached);
    });
  });
});
