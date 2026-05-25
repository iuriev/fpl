import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as squadService from './squad-service';
import * as fplClient from './fpl-client';
import * as cache from './cache';

vi.mock('./fpl-client');
vi.mock('./cache');

describe('Squad Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSquad', () => {
    it('composes squad from bootstrap, picks, and live data', async () => {
      const mockBootstrap = {
        events: [
          {
            id: 1,
            name: 'Gameweek 1',
            finished: false,
            average_entry_score: 50,
            highest_score: 100,
            deadline_time: '2025-01-01T12:00:00Z',
            is_current: true,
          },
        ],
        teams: [{ id: 1, name: 'Arsenal', short_name: 'ARS', code: 1 }],
        elements: [
          {
            id: 1,
            web_name: 'Saka',
            first_name: 'Bukayo',
            second_name: 'Saka',
            team: 1,
            team_code: 3,
            element_type: 3,
            status: 'a',
            chance_of_playing_this_round: null,
            news: '',
            now_cost: 85,
            event_points: 15,
            form: '6.7',
            selected_by_percent: '44.5',
          },
        ],
        element_types: [{ id: 3, singular_name_short: 'MID' }],
      };

      const mockPicks = {
        entry_history: {
          event: 1,
          points: 50,
          total_points: 50,
          rank: 1000,
          event_transfers: 1,
          event_transfers_cost: 4,
          points_on_bench: 5,
          bank: 15,
          value: 1010,
        },
        picks: [
          {
            element: 1,
            position: 1,
            is_captain: false,
            is_vice_captain: false,
          },
        ],
      };

      const mockLive = {
        elements: [
          {
            id: 1,
            stats: {
              total_points: 15,
              minutes: 90,
              goals_scored: 2,
              assists: 1,
              clean_sheets: 0,
              goals_conceded: 1,
              own_goals: 0,
              penalties_saved: 0,
              penalties_missed: 0,
              yellow_cards: 1,
              red_cards: 0,
              saves: 0,
              bonus: 3,
            },
          },
        ],
      };

      (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockBootstrap,
      );
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);
      (fplClient.getPicks as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockPicks);
      (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);
      (fplClient.getLive as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockLive);

      const result = await squadService.getSquad(123, 1);

      expect(result.gameweek).toBe(1);
      expect(result.summary.totalPoints).toBe(46);
      expect(result.summary.averagePoints).toBe(50);
      expect(result.summary.highestPoints).toBe(100);
      expect(result.summary.rank).toBe(1000);
      expect(result.summary.transfers).toBe(1);
      expect(result.starters).toHaveLength(1);
      expect(result.bench).toHaveLength(0);
      expect(result.starters[0].name).toBe('Saka');
      expect(result.starters[0].points).toBe(15);
      expect(result.starters[0].position).toBe('MID');
      expect(result.starters[0].club).toBe('ARS');
      expect(result.starters[0].teamCode).toBe(3);
      expect(result.starters[0].stats.goals_scored).toBe(2);
      expect(result.starters[0].stats.assists).toBe(1);
      expect(result.starters[0].stats.minutes).toBe(90);
      expect(result.starters[0].stats.bonus).toBe(3);
      expect(result.starters[0].stats.yellow_cards).toBe(1);
      expect(result.summary.bank).toBe(15);
      expect(result.starters[0].teamId).toBe(1);
      expect(result.starters[0].nowCost).toBe(85);
    });

    it('splits starters and bench correctly', async () => {
      const mockBootstrap = {
        events: [
          {
            id: 1,
            name: 'Gameweek 1',
            finished: false,
            average_entry_score: 50,
            highest_score: 100,
            deadline_time: '2025-01-01T12:00:00Z',
            is_current: true,
          },
        ],
        teams: [
          { id: 1, name: 'Arsenal', short_name: 'ARS', code: 1 },
          { id: 2, name: 'Chelsea', short_name: 'CHE', code: 2 },
        ],
        elements: [
          {
            id: 1,
            web_name: 'Saka',
            team: 1,
            team_code: 3,
            element_type: 3,
            status: 'a',
            chance_of_playing_this_round: null,
            news: '',
          },
          {
            id: 2,
            web_name: 'Mount',
            team: 2,
            team_code: 8,
            element_type: 3,
            status: 'a',
            chance_of_playing_this_round: null,
            news: '',
          },
        ],
        element_types: [{ id: 3, singular_name_short: 'MID' }],
      };

      const mockPicks = {
        entry_history: {
          event: 1,
          points: 50,
          total_points: 50,
          rank: 1000,
          event_transfers: 0,
          event_transfers_cost: 0,
          points_on_bench: 0,
        },
        picks: [
          { element: 1, position: 8, is_captain: false, is_vice_captain: false },
          { element: 2, position: 12, is_captain: false, is_vice_captain: false },
        ],
      };

      const mockLive = {
        elements: [
          { id: 1, stats: { total_points: 10, minutes: 90, goals_scored: 0, assists: 0, clean_sheets: 0, goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 0, red_cards: 0, saves: 0, bonus: 0 } },
          { id: 2, stats: { total_points: 5, minutes: 45, goals_scored: 0, assists: 0, clean_sheets: 0, goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 0, red_cards: 0, saves: 0, bonus: 0 } },
        ],
      };

      (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockBootstrap,
      );
      (fplClient.getPicks as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockPicks);
      (fplClient.getLive as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockLive);

      const result = await squadService.getSquad(123, 1);

      expect(result.starters).toHaveLength(1);
      expect(result.bench).toHaveLength(1);
      expect(result.starters[0].name).toBe('Saka');
      expect(result.bench[0].name).toBe('Mount');
    });

    it('throws error when gameweek not found', async () => {
      const mockBootstrap = {
        events: [],
        teams: [],
        elements: [],
        element_types: [],
      };

      (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockBootstrap,
      );

      await expect(squadService.getSquad(123, 999)).rejects.toThrow(
        'Gameweek 999 not found',
      );
    });

    it('throws error when no picks available', async () => {
      const mockBootstrap = {
        events: [
          {
            id: 1,
            name: 'Gameweek 1',
            finished: false,
            average_entry_score: 50,
            highest_score: 100,
            deadline_time: '2025-01-01T12:00:00Z',
            is_current: true,
          },
        ],
        teams: [],
        elements: [],
        element_types: [],
      };

      (cache.get as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(null);
      (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        mockBootstrap,
      );
      (fplClient.getPicks as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('FPL API error: 404 Not Found'),
      );

      await expect(squadService.getSquad(123, 1)).rejects.toThrow(
        'No picks available for gameweek 1',
      );
    });

    it('respects cache for bootstrap data', async () => {
      const mockBootstrap = {
        events: [
          {
            id: 1,
            name: 'Gameweek 1',
            finished: false,
            average_entry_score: 50,
            highest_score: 100,
            deadline_time: '2025-01-01T12:00:00Z',
            is_current: true,
          },
        ],
        teams: [],
        elements: [],
        element_types: [],
      };

      (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(mockBootstrap);

      await expect(squadService.getSquad(123, 1)).rejects.toThrow();
      expect(fplClient.getBootstrapStatic).not.toHaveBeenCalled();
    });
  });
});
