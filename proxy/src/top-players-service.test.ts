import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as dbCache from './fpl-cache/db-cache';
import * as topPlayersService from './top-players-service';

vi.mock('./db/client', () => ({ db: {} }));
vi.mock('./fpl-cache/db-cache');

const mockBootstrap = {
  total_players: 10000000,
  events: [
    { id: 1, name: 'Gameweek 1', finished: true, average_entry_score: 50, highest_score: 120, deadline_time: '2025-08-09T11:00:00Z', is_current: false, is_next: false, data_checked: true },
    { id: 2, name: 'Gameweek 2', finished: false, average_entry_score: 0, highest_score: 0, deadline_time: '2025-08-16T11:00:00Z', is_current: true, is_next: false, data_checked: false },
  ],
  teams: [
    { id: 1, name: 'Arsenal', short_name: 'ARS', code: 3 },
    { id: 2, name: 'Man City', short_name: 'MCI', code: 43 },
  ],
  elements: [
    { id: 10, web_name: 'Raya', team: 1, team_code: 3, element_type: 1, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 80, selected_by_percent: '12.5' },
    { id: 20, web_name: 'Saliba', team: 1, team_code: 3, element_type: 2, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 100, selected_by_percent: '34.2' },
    { id: 30, web_name: 'Haaland', team: 2, team_code: 43, element_type: 4, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 200, selected_by_percent: '66.7' },
    { id: 40, web_name: 'Saka', team: 1, team_code: 3, element_type: 3, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 150, selected_by_percent: '22.1' },
  ],
  element_types: [
    { id: 1, singular_name_short: 'GKP' },
    { id: 2, singular_name_short: 'DEF' },
    { id: 3, singular_name_short: 'MID' },
    { id: 4, singular_name_short: 'FWD' },
  ],
  chips: [],
};

const mockLive = {
  elements: [
    {
      id: 10,
      stats: { total_points: 6, minutes: 90, goals_scored: 0, assists: 0, clean_sheets: 1, goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 0, red_cards: 0, saves: 3, bonus: 0 },
      explain: [{ fixture: 1, stats: [{ identifier: 'minutes', points: 2, value: 90 }, { identifier: 'clean_sheets', points: 4, value: 1 }, { identifier: 'saves', points: 0, value: 3 }] }],
    },
    {
      id: 20,
      stats: { total_points: 14, minutes: 90, goals_scored: 1, assists: 1, clean_sheets: 1, goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 0, red_cards: 0, saves: 0, bonus: 3 },
      explain: [{ fixture: 1, stats: [{ identifier: 'minutes', points: 2, value: 90 }, { identifier: 'goals_scored', points: 6, value: 1 }, { identifier: 'assists', points: 3, value: 1 }, { identifier: 'clean_sheets', points: 4, value: 1 }, { identifier: 'bonus', points: 3, value: 3 }] }],
    },
    {
      id: 30,
      stats: { total_points: 18, minutes: 90, goals_scored: 2, assists: 0, clean_sheets: 0, goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 0, red_cards: 0, saves: 0, bonus: 3 },
      explain: [{ fixture: 1, stats: [{ identifier: 'minutes', points: 2, value: 90 }, { identifier: 'goals_scored', points: 12, value: 2 }, { identifier: 'bonus', points: 3, value: 3 }, { identifier: 'goals_conceded', points: 0, value: 0 }, { identifier: 'bps', points: 0, value: 42 }] }],
    },
    {
      id: 40,
      stats: { total_points: 12, minutes: 90, goals_scored: 1, assists: 0, clean_sheets: 0, goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 0, red_cards: 0, saves: 0, bonus: 2 },
      explain: [{ fixture: 1, stats: [{ identifier: 'minutes', points: 2, value: 90 }, { identifier: 'goals_scored', points: 6, value: 1 }, { identifier: 'bonus', points: 2, value: 2 }] }],
    },
  ],
};

describe('Top Players Service — gameweek', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValue(mockBootstrap as never);
    vi.mocked(dbCache.getOrFetchGwLive).mockResolvedValue(mockLive as never);
  });

  it('returns gw and players array', async () => {
    const result = await topPlayersService.getTopPlayersGameweek(1);

    expect(result.gw).toBe(1);
    expect(result.players).toHaveLength(4);
  });

  it('sorts players by points descending', async () => {
    const result = await topPlayersService.getTopPlayersGameweek(1);

    expect(result.players[0].points).toBeGreaterThanOrEqual(result.players[1].points);
    expect(result.players[1].points).toBeGreaterThanOrEqual(result.players[2].points);
  });

  it('maps player fields correctly', async () => {
    const result = await topPlayersService.getTopPlayersGameweek(1);
    const haaland = result.players.find((p) => p.id === 30)!;

    expect(haaland.webName).toBe('Haaland');
    expect(haaland.position).toBe('FWD');
    expect(haaland.teamCode).toBe(43);
    expect(haaland.teamShortName).toBe('MCI');
    expect(haaland.points).toBe(18);
  });

  it('throws when gameweek not found', async () => {
    await expect(topPlayersService.getTopPlayersGameweek(99)).rejects.toThrow('Gameweek 99 not found');
  });

  it('limits result to top 100', async () => {
    const manyElements = Array.from({ length: 150 }, (_, i) => ({
      id: i + 1,
      web_name: `Player${i + 1}`,
      team: 1,
      team_code: 3,
      element_type: 3,
      status: 'a',
      chance_of_playing_this_round: null,
      news: '',
      total_points: 150 - i,
      selected_by_percent: '5.0',
    }));
    const manyLive = {
      elements: manyElements.map((e, i) => ({
        id: e.id,
        stats: { total_points: 150 - i, minutes: 90, goals_scored: 0, assists: 0, clean_sheets: 0, goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 0, red_cards: 0, saves: 0, bonus: 0 },
        explain: [],
      })),
    };

    vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValueOnce({ ...mockBootstrap, elements: manyElements } as never);
    vi.mocked(dbCache.getOrFetchGwLive).mockResolvedValueOnce(manyLive as never);

    const result = await topPlayersService.getTopPlayersGameweek(1);

    expect(result.players).toHaveLength(100);
  });

  it('includes selectedByPercent from bootstrap', async () => {
    const result = await topPlayersService.getTopPlayersGameweek(1);
    const haaland = result.players.find((p) => p.id === 30)!;

    expect(haaland.selectedByPercent).toBe('66.7');
  });

  it('builds statBreakdown from explain, excluding hidden stats and zero values', async () => {
    const result = await topPlayersService.getTopPlayersGameweek(1);
    const haaland = result.players.find((p) => p.id === 30)!;

    expect(haaland.statBreakdown).toBeDefined();
    const identifiers = haaland.statBreakdown!.map((s) => s.identifier);
    expect(identifiers).toContain('goals_scored');
    expect(identifiers).toContain('bonus');
    expect(identifiers).toContain('minutes');
    expect(identifiers).not.toContain('goals_conceded');
    expect(identifiers).not.toContain('bps');
  });

  it('aggregates statBreakdown across multiple fixtures (double gameweek)', async () => {
    const doubleGwLive = {
      elements: [{
        id: 10,
        stats: { total_points: 14, minutes: 180, goals_scored: 2, assists: 0, clean_sheets: 2, goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0, yellow_cards: 0, red_cards: 0, saves: 0, bonus: 2 },
        explain: [
          { fixture: 1, stats: [{ identifier: 'goals_scored', points: 6, value: 1 }, { identifier: 'clean_sheets', points: 4, value: 1 }, { identifier: 'minutes', points: 2, value: 90 }] },
          { fixture: 2, stats: [{ identifier: 'goals_scored', points: 6, value: 1 }, { identifier: 'clean_sheets', points: 4, value: 1 }, { identifier: 'bonus', points: 2, value: 2 }, { identifier: 'minutes', points: 2, value: 90 }] },
        ],
      }],
    };

    vi.mocked(dbCache.getOrFetchGwLive).mockResolvedValueOnce(doubleGwLive as never);

    const result = await topPlayersService.getTopPlayersGameweek(1);
    const player = result.players.find((p) => p.id === 10)!;
    const goalsStat = player.statBreakdown!.find((s) => s.identifier === 'goals_scored')!;
    const csStat = player.statBreakdown!.find((s) => s.identifier === 'clean_sheets')!;

    expect(goalsStat.value).toBe(2);
    expect(goalsStat.points).toBe(12);
    expect(csStat.value).toBe(2);
    expect(csStat.points).toBe(8);
  });
});

describe('Top Players Service — season', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValue(mockBootstrap as never);
  });

  it('returns players array sorted by total_points descending', async () => {
    const result = await topPlayersService.getTopPlayersSeason();

    expect(result.players[0].points).toBeGreaterThanOrEqual(result.players[1].points);
    expect(result.players[1].points).toBeGreaterThanOrEqual(result.players[2].points);
  });

  it('maps player fields correctly', async () => {
    const result = await topPlayersService.getTopPlayersSeason();
    const haaland = result.players.find((p) => p.id === 30)!;

    expect(haaland.webName).toBe('Haaland');
    expect(haaland.position).toBe('FWD');
    expect(haaland.teamCode).toBe(43);
    expect(haaland.teamShortName).toBe('MCI');
    expect(haaland.points).toBe(200);
  });

  it('limits result to top 100', async () => {
    const manyElements = Array.from({ length: 150 }, (_, i) => ({
      id: i + 1,
      web_name: `Player${i + 1}`,
      team: 1,
      team_code: 3,
      element_type: 3,
      status: 'a',
      chance_of_playing_this_round: null,
      news: '',
      total_points: 200 - i,
      selected_by_percent: '5.0',
    }));

    vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValueOnce({ ...mockBootstrap, elements: manyElements } as never);

    const result = await topPlayersService.getTopPlayersSeason();

    expect(result.players).toHaveLength(100);
  });

  it('includes selectedByPercent in season response', async () => {
    const result = await topPlayersService.getTopPlayersSeason();
    const haaland = result.players.find((p) => p.id === 30)!;

    expect(haaland.selectedByPercent).toBe('66.7');
    expect(haaland.statBreakdown).toBeUndefined();
  });

  it('top season player is first in list', async () => {
    const result = await topPlayersService.getTopPlayersSeason();

    expect(result.players[0].id).toBe(30);
    expect(result.players[0].points).toBe(200);
  });
});
