import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as fplClient from './fpl-client';

describe('FPL Client', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getBootstrapStatic', () => {
    it('fetches bootstrap-static endpoint', async () => {
      const mockData = {
        events: [{ id: 1, name: 'Gameweek 1', is_current: true, finished: false }],
        teams: [{ id: 1, name: 'Arsenal', code: 1 }],
        elements: [{ id: 1, web_name: 'Saka', team: 1, element_type: 3 }],
        element_types: [{ id: 3, singular_name_short: 'MID' }],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fplClient.getBootstrapStatic();
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('https://fantasy.premierleague.com/api/bootstrap-static/');
    });

    it('throws on API error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fplClient.getBootstrapStatic()).rejects.toThrow(
        'FPL API error: 500 Internal Server Error',
      );
    });
  });

  describe('getEntry', () => {
    it('fetches entry endpoint with team ID', async () => {
      const mockData = {
        id: 123,
        name: 'My Team',
        player_first_name: 'John',
        player_last_name: 'Doe',
        summary_overall_rank: 50000,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fplClient.getEntry(123);
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('https://fantasy.premierleague.com/api/entry/123/');
    });

    it('throws on 404 for unknown team', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(fplClient.getEntry(999999)).rejects.toThrow('FPL API error: 404 Not Found');
    });
  });

  describe('getPicks', () => {
    it('fetches picks for a gameweek', async () => {
      const mockData = {
        entry_history: {
          event: 1,
          points: 50,
          total_points: 50,
          rank: 1000,
          event_transfers: 1,
          event_transfers_cost: 4,
          points_on_bench: 5,
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

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fplClient.getPicks(123, 1);
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://fantasy.premierleague.com/api/entry/123/event/1/picks/',
      );
    });
  });

  describe('getLive', () => {
    it('fetches live data for a gameweek', async () => {
      const mockData = {
        elements: [
          {
            id: 1,
            stats: {
              total_points: 15,
            },
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fplClient.getLive(1);
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('https://fantasy.premierleague.com/api/event/1/live/');
    });
  });

  describe('getFixtures', () => {
    it('calls /fixtures/?event={gw} and returns fixture array', async () => {
      const mockData = [
        {
          id: 1,
          event: 3,
          team_h: 1,
          team_a: 14,
          team_h_difficulty: 3,
          team_a_difficulty: 2,
          kickoff_time: '2025-09-01T15:00:00Z',
          finished: false,
        },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await fplClient.getFixtures(3);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://fantasy.premierleague.com/api/fixtures/?event=3'
      );
      expect(result).toEqual(mockData);
    });
  });
});
