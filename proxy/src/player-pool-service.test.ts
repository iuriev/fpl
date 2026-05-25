import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as playerPoolService from './player-pool-service';
import * as fplClient from './fpl-client';
import * as cache from './cache';
import * as fixturesService from './fixtures-service';

vi.mock('./fpl-client');
vi.mock('./cache');
vi.mock('./fixtures-service');

const mockBootstrap = {
  total_players: 10000000,
  events: [],
  teams: [{ id: 1, name: 'Arsenal', short_name: 'ARS', code: 3 }],
  elements: [
    {
      id: 100, web_name: 'Saka', first_name: 'Bukayo', second_name: 'Saka',
      team: 1, team_code: 3, element_type: 3, status: 'a',
      chance_of_playing_this_round: null, news: '',
      total_points: 120, now_cost: 95, event_points: 12,
      form: '7.2', selected_by_percent: '44.5',
    },
  ],
  element_types: [],
};

describe('player-pool-service', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getPlayerPool', () => {
    it('composes pool players from bootstrap and fixture data', async () => {
      vi.mocked(cache.get).mockReturnValue(null);
      vi.mocked(cache.set).mockReturnValue(undefined);
      vi.mocked(fplClient.getBootstrapStatic).mockResolvedValue(mockBootstrap as any);
      vi.mocked(fixturesService.getUpcomingFixtures).mockResolvedValue({
        1: [{ gw: 3, opponent: 'MCI', home: true, difficulty: 4 }],
      });

      const result = await playerPoolService.getPlayerPool();

      expect(result.players).toHaveLength(1);
      expect(result.players[0]).toMatchObject({
        id: 100,
        webName: 'Saka',
        firstName: 'Bukayo',
        lastName: 'Saka',
        team: 1,
        teamCode: 3,
        teamShortName: 'ARS',
        position: 'MID',
        nowCost: 95,
        totalPoints: 120,
        eventPoints: 12,
        status: 'a',
        form: '7.2',
        selectedByPercent: '44.5',
        nextFixtures: [{ gw: 3, opponent: 'MCI', home: true, difficulty: 4 }],
      });
      expect(cache.set).toHaveBeenCalledWith('player-pool', expect.any(Object), 600);
    });

    it('returns cached result without hitting FPL', async () => {
      const cached = { players: [] };
      vi.mocked(cache.get).mockReturnValue(cached);

      const result = await playerPoolService.getPlayerPool();

      expect(fplClient.getBootstrapStatic).not.toHaveBeenCalled();
      expect(result).toEqual(cached);
    });
  });
});
