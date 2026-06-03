import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as dbCache from './fpl-cache/db-cache';
import * as squadService from './squad-service';

vi.mock('./db/client', () => ({ db: {} }));
vi.mock('./fpl-cache/db-cache');

describe('Squad Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSquad', () => {
    it('composes squad from bootstrap, picks, and live data', async () => {
      const mockBootstrap = {
        events: [{
          id: 1, name: 'Gameweek 1', finished: false, average_entry_score: 50, highest_score: 100,
          deadline_time: '2025-01-01T12:00:00Z', is_current: true, is_next: false, data_checked: false,
        }],
        teams: [{ id: 1, name: 'Arsenal', short_name: 'ARS', code: 1 }],
        chips: [],
        elements: [{
          id: 1, web_name: 'Saka', first_name: 'Bukayo', second_name: 'Saka', team: 1, team_code: 3,
          element_type: 3, status: 'a', chance_of_playing_this_round: null, news: '',
          now_cost: 85, event_points: 15, form: '6.7', selected_by_percent: '44.5',
        }],
        element_types: [{ id: 3, singular_name_short: 'MID' }],
      };
      const mockPicks = {
        active_chip: null,
        entry_history: { event: 1, points: 50, total_points: 50, rank: 1000, event_transfers: 1, event_transfers_cost: 4, points_on_bench: 5, bank: 15, value: 1010 },
        picks: [{ element: 1, position: 1, is_captain: false, is_vice_captain: false }],
      };
      const mockLive = {
        elements: [{
          id: 1,
          stats: { total_points: 15, minutes: 90, goals_scored: 2, assists: 1, clean_sheets: 0, goals_conceded: 1, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 1, red_cards: 0, saves: 0, bonus: 3 },
          explain: [],
        }],
      };

      vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValueOnce(mockBootstrap as never);
      vi.mocked(dbCache.getSeasonMeta).mockResolvedValueOnce({ isComplete: false });
      vi.mocked(dbCache.getOrFetchSquad).mockResolvedValueOnce(mockPicks as never);
      vi.mocked(dbCache.getOrFetchGwLive).mockResolvedValueOnce(mockLive as never);
      vi.mocked(dbCache.getOrFetchHistory).mockResolvedValueOnce({ current: [], chips: [] } as never);

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
      expect(result.summary.freeTransfers).toBe(0);
      expect(result.starters[0].teamId).toBe(1);
      expect(result.starters[0].nowCost).toBe(85);
      expect(result.activeChip).toBeNull();
    });

    it('splits starters and bench correctly', async () => {
      const mockBootstrap = {
        events: [{
          id: 1, name: 'Gameweek 1', finished: false, average_entry_score: 50, highest_score: 100,
          deadline_time: '2025-01-01T12:00:00Z', is_current: true, is_next: false, data_checked: false,
        }],
        teams: [
          { id: 1, name: 'Arsenal', short_name: 'ARS', code: 1 },
          { id: 2, name: 'Chelsea', short_name: 'CHE', code: 2 },
        ],
        chips: [],
        elements: [
          { id: 1, web_name: 'Saka', team: 1, team_code: 3, element_type: 3, status: 'a', chance_of_playing_this_round: null, news: '' },
          { id: 2, web_name: 'Mount', team: 2, team_code: 8, element_type: 3, status: 'a', chance_of_playing_this_round: null, news: '' },
        ],
        element_types: [{ id: 3, singular_name_short: 'MID' }],
      };
      const mockPicks = {
        active_chip: null,
        entry_history: { event: 1, points: 50, total_points: 50, rank: 1000, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 0 },
        picks: [
          { element: 1, position: 8, is_captain: false, is_vice_captain: false },
          { element: 2, position: 12, is_captain: false, is_vice_captain: false },
        ],
      };
      const mockLive = {
        elements: [
          { id: 1, stats: { total_points: 10, minutes: 90, goals_scored: 0, assists: 0, clean_sheets: 0, goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 0, red_cards: 0, saves: 0, bonus: 0 }, explain: [] },
          { id: 2, stats: { total_points: 5, minutes: 45, goals_scored: 0, assists: 0, clean_sheets: 0, goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 0, red_cards: 0, saves: 0, bonus: 0 }, explain: [] },
        ],
      };

      vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValueOnce(mockBootstrap as never);
      vi.mocked(dbCache.getSeasonMeta).mockResolvedValueOnce({ isComplete: false });
      vi.mocked(dbCache.getOrFetchSquad).mockResolvedValueOnce(mockPicks as never);
      vi.mocked(dbCache.getOrFetchGwLive).mockResolvedValueOnce(mockLive as never);
      vi.mocked(dbCache.getOrFetchHistory).mockResolvedValueOnce({ current: [], chips: [] } as never);

      const result = await squadService.getSquad(123, 1);

      expect(result.starters).toHaveLength(1);
      expect(result.bench).toHaveLength(1);
      expect(result.starters[0].name).toBe('Saka');
      expect(result.bench[0].name).toBe('Mount');
    });

    it('throws error when gameweek not found', async () => {
      vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValueOnce({
        events: [{ id: 1, name: 'Gameweek 1', finished: false, average_entry_score: 0, highest_score: 0, deadline_time: '2025-08-09T11:00:00Z', is_current: false, is_next: false, data_checked: false }],
        teams: [], chips: [], elements: [], element_types: [],
      } as never);
      vi.mocked(dbCache.getSeasonMeta).mockResolvedValueOnce({ isComplete: false });

      await expect(squadService.getSquad(123, 999)).rejects.toThrow('Gameweek 999 not found');
    });

    it('throws error when no picks available', async () => {
      const mockBootstrap = {
        events: [{
          id: 1, name: 'Gameweek 1', finished: false, average_entry_score: 50, highest_score: 100,
          deadline_time: '2025-01-01T12:00:00Z', is_current: true, is_next: false, data_checked: false,
        }],
        teams: [], chips: [], elements: [], element_types: [],
      };

      vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValueOnce(mockBootstrap as never);
      vi.mocked(dbCache.getSeasonMeta).mockResolvedValueOnce({ isComplete: false });
      vi.mocked(dbCache.getOrFetchSquad).mockRejectedValueOnce(new Error('FPL API error: 404 Not Found'));

      await expect(squadService.getSquad(123, 1)).rejects.toThrow('No picks available for gameweek 1');
    });

    it.each([
      ['wildcard', 'wildcard'],
      ['3xc', '3xc'],
      ['freehit', 'freehit'],
      ['bboost', 'bboost'],
      ['unknown_chip', null],
      [null, null],
    ] as const)('normalises active_chip "%s" → activeChip %s', async (raw, expected) => {
      const bootstrap = {
        events: [{
          id: 1, name: 'Gameweek 1', finished: false, average_entry_score: 50, highest_score: 100,
          deadline_time: '2025-01-01T12:00:00Z', is_current: true, is_next: false, data_checked: false,
        }],
        teams: [{ id: 1, name: 'Arsenal', short_name: 'ARS', code: 1 }],
        chips: [],
        elements: [{
          id: 1, web_name: 'Saka', first_name: 'Bukayo', second_name: 'Saka', team: 1, team_code: 3,
          element_type: 3, status: 'a', chance_of_playing_this_round: null, news: '',
          now_cost: 85, event_points: 0, form: '0', selected_by_percent: '0',
        }],
        element_types: [{ id: 3, singular_name_short: 'MID' }],
      };
      const picks = {
        active_chip: raw as string | null,
        entry_history: { event: 1, points: 0, total_points: 0, rank: 0, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 0, bank: 0, value: 0 },
        picks: [{ element: 1, position: 1, is_captain: false, is_vice_captain: false }],
      };
      const live = {
        elements: [{
          id: 1,
          stats: { total_points: 0, minutes: 0, goals_scored: 0, assists: 0, clean_sheets: 0, goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 0, red_cards: 0, saves: 0, bonus: 0 },
          explain: [],
        }],
      };

      vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValueOnce(bootstrap as never);
      vi.mocked(dbCache.getSeasonMeta).mockResolvedValueOnce({ isComplete: false });
      vi.mocked(dbCache.getOrFetchSquad).mockResolvedValueOnce(picks as never);
      vi.mocked(dbCache.getOrFetchGwLive).mockResolvedValueOnce(live as never);
      vi.mocked(dbCache.getOrFetchHistory).mockResolvedValueOnce({ current: [], chips: [] } as never);

      const result = await squadService.getSquad(123, 1);
      expect(result.activeChip).toBe(expected);
    });

    it('includes chipStatuses in the response', async () => {
      const bootstrap = {
        events: [
          { id: 1, name: 'Gameweek 1', finished: true, average_entry_score: 50, highest_score: 100, deadline_time: '2025-08-09T11:00:00Z', is_current: false, is_next: false, data_checked: true },
          { id: 5, name: 'Gameweek 5', finished: true, average_entry_score: 55, highest_score: 110, deadline_time: '2025-08-30T12:00:00Z', is_current: false, is_next: false, data_checked: true },
        ],
        teams: [{ id: 1, name: 'Arsenal', short_name: 'ARS', code: 1 }],
        chips: [
          { chip_type: 'transfer', name: 'wildcard', start_event: 1, stop_event: 19 },
          { chip_type: 'transfer', name: 'wildcard', start_event: 20, stop_event: 38 },
        ],
        elements: [{
          id: 1, web_name: 'Saka', first_name: 'Bukayo', second_name: 'Saka', team: 1, team_code: 3,
          element_type: 3, status: 'a', chance_of_playing_this_round: null, news: '',
          now_cost: 85, event_points: 0, form: '0', selected_by_percent: '0', ep_next: '5',
        }],
        element_types: [{ id: 3, singular_name_short: 'MID' }],
      };
      const picks = {
        active_chip: 'wildcard',
        entry_history: { event: 5, points: 60, total_points: 200, rank: 500, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 3, bank: 10, value: 1005 },
        picks: [{ element: 1, position: 1, is_captain: false, is_vice_captain: false }],
      };
      const live = {
        elements: [{
          id: 1,
          stats: { total_points: 8, minutes: 90, goals_scored: 0, assists: 0, clean_sheets: 0, goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 0, red_cards: 0, saves: 0, bonus: 0 },
          explain: [],
        }],
      };

      vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValueOnce(bootstrap as never);
      vi.mocked(dbCache.getSeasonMeta).mockResolvedValueOnce({ isComplete: false });
      vi.mocked(dbCache.getOrFetchSquad).mockResolvedValueOnce(picks as never);
      vi.mocked(dbCache.getOrFetchGwLive).mockResolvedValueOnce(live as never);
      vi.mocked(dbCache.getOrFetchHistory).mockResolvedValueOnce({ current: [], chips: [] } as never);

      const result = await squadService.getSquad(123, 5);
      expect(result.chipStatuses.wildcard).toEqual({ status: 'active' });
      expect(result.chipStatuses.freehit).toEqual({ status: 'available' });
      expect(result.chipStatuses.bboost).toEqual({ status: 'available' });
      expect(result.chipStatuses['3xc']).toEqual({ status: 'available' });
    });
  });

  describe('computeFreeTransfers', () => {
    it('returns 1 for empty history (season start)', () => {
      expect(squadService.computeFreeTransfers([])).toBe(1);
    });

    it('banks 1 when no transfer made last GW', () => {
      const history = [
        { event: 1, event_transfers: 0 } as Parameters<
          typeof squadService.computeFreeTransfers
        >[0][number],
      ];
      expect(squadService.computeFreeTransfers(history)).toBe(2);
    });

    it('caps at 2 even after multiple unused GWs', () => {
      const history = [
        { event: 1, event_transfers: 0 },
        { event: 2, event_transfers: 0 },
        { event: 3, event_transfers: 0 },
      ] as Parameters<typeof squadService.computeFreeTransfers>[0];
      expect(squadService.computeFreeTransfers(history)).toBe(2);
    });

    it('resets to 1 when a transfer is made with only 1 free', () => {
      const history = [{ event: 1, event_transfers: 1 }] as Parameters<
        typeof squadService.computeFreeTransfers
      >[0];
      expect(squadService.computeFreeTransfers(history)).toBe(1);
    });

    it('resets to 1 after using a banked free transfer', () => {
      const history = [
        { event: 1, event_transfers: 0 },
        { event: 2, event_transfers: 2 },
      ] as Parameters<typeof squadService.computeFreeTransfers>[0];
      expect(squadService.computeFreeTransfers(history)).toBe(1);
    });
  });

  describe('computeChipStatuses', () => {
    const wcWindows = [
      { chip_type: 'transfer', name: 'wildcard', start_event: 1, stop_event: 19 },
      { chip_type: 'transfer', name: 'wildcard', start_event: 20, stop_event: 38 },
    ];

    it('returns active for the current active chip', () => {
      const result = squadService.computeChipStatuses('wildcard', [], wcWindows, 10);
      expect(result.wildcard).toEqual({ status: 'active' });
      expect(result.freehit).toEqual({ status: 'available' });
      expect(result.bboost).toEqual({ status: 'available' });
      expect(result['3xc']).toEqual({ status: 'available' });
    });

    it('returns used with usedInGw for a chip played this season (non-wildcard)', () => {
      const played = [{ name: 'freehit', event: 5, time: '2025-01-05T12:00:00Z' }];
      const result = squadService.computeChipStatuses(null, played, wcWindows, 10);
      expect(result.freehit).toEqual({ status: 'used', usedInGw: 5 });
      expect(result.bboost).toEqual({ status: 'available' });
    });

    it('marks wildcard used with usedInGw when played in the current window', () => {
      const played = [{ name: 'wildcard', event: 8, time: '2025-01-08T12:00:00Z' }];
      const result = squadService.computeChipStatuses(null, played, wcWindows, 10);
      expect(result.wildcard).toEqual({ status: 'used', usedInGw: 8 });
    });

    it('keeps wildcard available in second window when only first was used', () => {
      const played = [{ name: 'wildcard', event: 8, time: '2025-01-08T12:00:00Z' }];
      const result = squadService.computeChipStatuses(null, played, wcWindows, 25);
      expect(result.wildcard).toEqual({ status: 'available' });
    });

    it('returns available for all chips when nothing played and no active chip', () => {
      const result = squadService.computeChipStatuses(null, [], wcWindows, 15);
      expect(result).toEqual({
        wildcard: { status: 'available' },
        freehit: { status: 'available' },
        bboost: { status: 'available' },
        '3xc': { status: 'available' },
      });
    });

    it('active takes precedence over used (chip replayed edge case)', () => {
      const played = [{ name: 'bboost', event: 3, time: '2025-01-03T12:00:00Z' }];
      const result = squadService.computeChipStatuses('bboost', played, wcWindows, 10);
      expect(result.bboost).toEqual({ status: 'active' });
    });
  });
});
