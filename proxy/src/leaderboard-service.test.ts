import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as dbCache from './fpl-cache/db-cache';
import * as leaderboardService from './leaderboard-service';

vi.mock('./db/client', () => ({ db: {} }));
vi.mock('./fpl-cache/db-cache');

const mockBootstrap = {
  total_players: 10000000,
  events: [
    { id: 1, name: 'Gameweek 1', finished: true, average_entry_score: 50, highest_score: 120, deadline_time: '2025-08-09T11:00:00Z', is_current: false, is_next: false, data_checked: true },
    { id: 2, name: 'Gameweek 2', finished: true, average_entry_score: 45, highest_score: 110, deadline_time: '2025-08-16T11:00:00Z', is_current: false, is_next: false, data_checked: true },
    { id: 3, name: 'Gameweek 3', finished: false, average_entry_score: 0, highest_score: 0, deadline_time: '2025-08-23T11:00:00Z', is_current: true, is_next: false, data_checked: false },
  ],
  teams: [
    { id: 1, name: 'Arsenal', short_name: 'ARS', code: 3 },
    { id: 2, name: 'Man City', short_name: 'MCI', code: 43 },
  ],
  elements: [
    { id: 10, web_name: 'Saliba', team: 1, team_code: 3, element_type: 2, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 80, selected_by_percent: '22.5', first_name: 'William', second_name: 'Saliba', now_cost: 55, event_points: 6, form: '6.0', ep_next: '6.0', cost_change_event: 0, cost_change_start: 0, transfers_in_event: 0, transfers_out_event: 0, price_change_percent: '0.0' },
    { id: 20, web_name: 'Haaland', team: 2, team_code: 43, element_type: 4, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 200, selected_by_percent: '62.5', first_name: 'Erling', second_name: 'Haaland', now_cost: 145, event_points: 20, form: '10.0', ep_next: '10.0', cost_change_event: 0, cost_change_start: 0, transfers_in_event: 0, transfers_out_event: 0, price_change_percent: '0.0' },
    { id: 30, web_name: 'Gabriel', team: 1, team_code: 3, element_type: 2, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 70, selected_by_percent: '18.0', first_name: 'Gabriel', second_name: 'Magalhães', now_cost: 60, event_points: 6, form: '5.0', ep_next: '5.0', cost_change_event: 0, cost_change_start: 0, transfers_in_event: 0, transfers_out_event: 0, price_change_percent: '0.0' },
  ],
  element_types: [{ id: 1, singular_name_short: 'GKP' }, { id: 2, singular_name_short: 'DEF' }, { id: 3, singular_name_short: 'MID' }, { id: 4, singular_name_short: 'FWD' }],
  chips: [],
};

function mkLive(elements: Array<{ id: number; bonus: number; defcon: number }>) {
  return {
    elements: elements.map(({ id, bonus, defcon }) => ({
      id,
      stats: { total_points: 5, minutes: 90, goals_scored: 0, assists: 0, clean_sheets: 0, goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 0, red_cards: 0, saves: 0, bonus, bps: 0 },
      explain: [{ fixture: 1, stats: defcon > 0 ? [{ identifier: 'defensive_contribution', value: defcon, points: 2 }] : [] }],
    })),
  };
}

describe('getLeaderboardGw', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValue(mockBootstrap as never);
  });

  it('returns top players sorted by bonus desc', async () => {
    vi.mocked(dbCache.getOrFetchGwLive).mockResolvedValueOnce(
      mkLive([
        { id: 10, bonus: 30, defcon: 5 },
        { id: 20, bonus: 50, defcon: 0 },
        { id: 30, bonus: 20, defcon: 8 },
      ]) as never
    );

    const result = await leaderboardService.getLeaderboardGw(1);

    expect(result.gw).toBe(1);
    expect(result.bps[0].id).toBe(20);
    expect(result.bps[0].value).toBe(50);
    expect(result.bps[1].id).toBe(10);
    expect(result.bps[2].id).toBe(30);
  });

  it('returns top players sorted by defensive_contribution desc', async () => {
    vi.mocked(dbCache.getOrFetchGwLive).mockResolvedValueOnce(
      mkLive([
        { id: 10, bonus: 30, defcon: 5 },
        { id: 20, bonus: 50, defcon: 0 },
        { id: 30, bonus: 20, defcon: 8 },
      ]) as never
    );

    const result = await leaderboardService.getLeaderboardGw(1);

    expect(result.defcon[0].id).toBe(30);
    expect(result.defcon[0].value).toBe(8);
    expect(result.defcon[1].id).toBe(10);
    expect(result.defcon[1].value).toBe(5);
  });

  it('excludes players with defcon = 0 from the DEFCON list', async () => {
    vi.mocked(dbCache.getOrFetchGwLive).mockResolvedValueOnce(
      mkLive([
        { id: 10, bonus: 30, defcon: 5 },
        { id: 20, bonus: 50, defcon: 0 },
      ]) as never
    );

    const result = await leaderboardService.getLeaderboardGw(1);

    expect(result.defcon).toHaveLength(1);
    expect(result.defcon[0].id).toBe(10);
  });

  it('caps both lists at 50 players', async () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ id: i + 1, bonus: 60 - i, defcon: i + 1 }));
    const bootstrapWithMany = {
      ...mockBootstrap,
      elements: many.map((p) => ({
        id: p.id,
        web_name: `Player${p.id}`,
        team: 1,
        team_code: 3,
        element_type: 3,
        status: 'a',
        chance_of_playing_this_round: null,
        news: '',
        total_points: 50,
        selected_by_percent: '5.0',
        first_name: 'A',
        second_name: 'B',
        now_cost: 50,
        event_points: 5,
        form: '5.0',
        ep_next: '5.0',
        cost_change_event: 0,
        cost_change_start: 0,
        transfers_in_event: 0,
        transfers_out_event: 0,
        price_change_percent: '0.0',
      })),
    };
    vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValueOnce(bootstrapWithMany as never);
    vi.mocked(dbCache.getOrFetchGwLive).mockResolvedValueOnce(mkLive(many) as never);

    const result = await leaderboardService.getLeaderboardGw(1);

    expect(result.bps).toHaveLength(50);
    expect(result.defcon).toHaveLength(50);
  });

  it('returns empty lists when FPL API throws (404 / no data)', async () => {
    vi.mocked(dbCache.getOrFetchGwLive).mockRejectedValueOnce(new Error('FPL API error: 404 Not Found'));

    const result = await leaderboardService.getLeaderboardGw(1);

    expect(result.bps).toHaveLength(0);
    expect(result.defcon).toHaveLength(0);
  });

  it('sums defcon across multiple fixtures for a single player', async () => {
    vi.mocked(dbCache.getOrFetchGwLive).mockResolvedValueOnce({
      elements: [{
        id: 10,
        stats: { total_points: 5, minutes: 90, goals_scored: 0, assists: 0, clean_sheets: 1, goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 0, red_cards: 0, saves: 0, bonus: 0, bps: 20 },
        explain: [
          { fixture: 1, stats: [{ identifier: 'defensive_contribution', value: 6, points: 2 }] },
          { fixture: 2, stats: [{ identifier: 'defensive_contribution', value: 4, points: 1 }, { identifier: 'minutes', value: 90, points: 2 }] },
        ],
      }],
    } as never);

    const result = await leaderboardService.getLeaderboardGw(1);

    expect(result.defcon[0].value).toBe(10);
  });
});

describe('getLeaderboardSeason', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValue(mockBootstrap as never);
  });

  it('aggregates bps and defcon across all finished GWs only', async () => {
    vi.mocked(dbCache.getOrFetchGwLive)
      .mockResolvedValueOnce(mkLive([{ id: 10, bonus: 10, defcon: 5 }, { id: 20, bonus: 30, defcon: 0 }]) as never)
      .mockResolvedValueOnce(mkLive([{ id: 10, bonus: 20, defcon: 8 }, { id: 20, bonus: 15, defcon: 0 }]) as never);

    const result = await leaderboardService.getLeaderboardSeason();

    expect(result.bps[0].id).toBe(20);
    expect(result.bps[0].value).toBe(45);
    expect(result.bps[1].id).toBe(10);
    expect(result.bps[1].value).toBe(30);

    expect(result.defcon[0].id).toBe(10);
    expect(result.defcon[0].value).toBe(13);
    expect(result.defcon[0].avg).toBe(6.5);
    expect(result.defcon).toHaveLength(1);
  });
});
