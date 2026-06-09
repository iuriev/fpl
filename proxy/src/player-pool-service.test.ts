import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as cache from './cache';
import * as fixturesService from './fixtures-service';
import * as dbCache from './fpl-cache/db-cache';
import * as playerPoolService from './player-pool-service';
import * as predictionService from './prediction-service';

vi.mock('./db/client', () => ({ db: {} }));
vi.mock('./fpl-cache/db-cache');
vi.mock('./cache');
vi.mock('./fixtures-service');
vi.mock('./prediction-service', () => ({
  getPredictionsForEvent: vi.fn(async () => ({ ready: false, players: [] })),
}));

const mockBootstrap = {
  total_players: 10000000,
  events: [],
  teams: [{ id: 1, name: 'Arsenal', short_name: 'ARS', code: 3 }],
  elements: [
    {
      id: 100,
      code: 16,
      web_name: 'Saka',
      first_name: 'Bukayo',
      second_name: 'Saka',
      team: 1,
      team_code: 3,
      element_type: 3,
      status: 'a',
      chance_of_playing_this_round: null,
      news: '',
      total_points: 120,
      now_cost: 95,
      event_points: 12,
      form: '7.2',
      selected_by_percent: '44.5',
      ep_next: '5.5',
    },
  ],
  element_types: [],
  chips: [],
};

describe('player-pool-service', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getPlayerPool', () => {
    it('composes pool players from bootstrap and fixture data', async () => {
      vi.mocked(cache.get).mockReturnValue(null);
      vi.mocked(cache.set).mockReturnValue(undefined);
      vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValueOnce(mockBootstrap as never);
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
        expectedPoints: '5.5',
        nextFixtures: [{ gw: 3, opponent: 'MCI', home: true, difficulty: 4 }],
      });
      expect(cache.set).toHaveBeenCalledWith('player-pool', expect.any(Object), 3600);
    });

    it('uses model xPts for expectedPoints when predictions are ready', async () => {
      vi.mocked(cache.get).mockReturnValue(null);
      vi.mocked(cache.set).mockReturnValue(undefined);
      vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValueOnce({
        ...mockBootstrap,
        events: [{ id: 3, is_next: true, is_current: false, finished: false }],
      } as never);
      vi.mocked(fixturesService.getUpcomingFixtures).mockResolvedValue({ 1: [] });
      vi.mocked(predictionService.getPredictionsForEvent).mockResolvedValueOnce({
        event: 3,
        modelRunId: 'test',
        ready: true,
        players: [
          {
            fplCode: 16,
            seasonElementId: 100,
            event: 3,
            xPts: 7.3,
            xGoals: 0,
            xAssists: 0,
            csProb: null,
            defconPts: 0,
            confidence: 'high',
            epNextAnchor: 5.5,
            modelXPts: 7.3,
          },
        ],
      });

      const result = await playerPoolService.getPlayerPool();

      expect(result.players[0].expectedPoints).toBe('7.3');
    });

    it('returns cached result without hitting FPL', async () => {
      const cached = { players: [] };
      vi.mocked(cache.get).mockReturnValue(cached);

      const result = await playerPoolService.getPlayerPool();

      expect(dbCache.getOrFetchBootstrap).not.toHaveBeenCalled();
      expect(result).toEqual(cached);
    });
  });
});
