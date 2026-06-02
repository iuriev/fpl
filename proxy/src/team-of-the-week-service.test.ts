import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as cache from './cache';
import * as fplClient from './fpl-client';
import * as teamOfTheWeekService from './team-of-the-week-service';

vi.mock('./fpl-client');
vi.mock('./cache');

const mockBootstrap = {
  events: [
    {
      id: 1,
      name: 'Gameweek 1',
      finished: true,
      average_entry_score: 50,
      highest_score: 120,
      deadline_time: '2025-08-09T11:00:00Z',
      is_current: false,
    },
    {
      id: 2,
      name: 'Gameweek 2',
      finished: false,
      average_entry_score: 0,
      highest_score: 0,
      deadline_time: '2025-08-16T11:00:00Z',
      is_current: true,
    },
  ],
  teams: [
    { id: 1, name: 'Arsenal', short_name: 'ARS', code: 3 },
    { id: 2, name: 'Man City', short_name: 'MCI', code: 43 },
  ],
  elements: [
    { id: 10, web_name: 'Raya', team: 1, team_code: 3, element_type: 1, status: 'a', chance_of_playing_this_round: null, news: '' },
    { id: 20, web_name: 'Saliba', team: 1, team_code: 3, element_type: 2, status: 'a', chance_of_playing_this_round: null, news: '' },
    { id: 30, web_name: 'Gabriel', team: 1, team_code: 3, element_type: 2, status: 'a', chance_of_playing_this_round: null, news: '' },
    { id: 40, web_name: 'White', team: 1, team_code: 3, element_type: 2, status: 'a', chance_of_playing_this_round: null, news: '' },
    { id: 50, web_name: 'Saka', team: 1, team_code: 3, element_type: 3, status: 'a', chance_of_playing_this_round: null, news: '' },
    { id: 60, web_name: 'Ødegaard', team: 1, team_code: 3, element_type: 3, status: 'a', chance_of_playing_this_round: null, news: '' },
    { id: 70, web_name: 'Havertz', team: 1, team_code: 3, element_type: 3, status: 'a', chance_of_playing_this_round: null, news: '' },
    { id: 80, web_name: 'Rice', team: 1, team_code: 3, element_type: 3, status: 'a', chance_of_playing_this_round: null, news: '' },
    { id: 90, web_name: 'Haaland', team: 2, team_code: 43, element_type: 4, status: 'a', chance_of_playing_this_round: null, news: '' },
    { id: 100, web_name: 'Jesus', team: 1, team_code: 3, element_type: 4, status: 'a', chance_of_playing_this_round: null, news: '' },
    { id: 110, web_name: 'Trossard', team: 1, team_code: 3, element_type: 4, status: 'a', chance_of_playing_this_round: null, news: '' },
  ],
  element_types: [
    { id: 1, singular_name_short: 'GKP' },
    { id: 2, singular_name_short: 'DEF' },
    { id: 3, singular_name_short: 'MID' },
    { id: 4, singular_name_short: 'FWD' },
  ],
};

const mockTeamOfTheWeek = {
  team: [
    { element: 10, points: 10, position: 1 },
    { element: 20, points: 12, position: 2 },
    { element: 30, points: 11, position: 3 },
    { element: 40, points: 9, position: 4 },
    { element: 50, points: 18, position: 5 },
    { element: 60, points: 15, position: 6 },
    { element: 70, points: 14, position: 7 },
    { element: 80, points: 13, position: 8 },
    { element: 90, points: 20, position: 9 },
    { element: 100, points: 16, position: 10 },
    { element: 110, points: 8, position: 11 },
  ],
  top_player: { id: 90, points: 20 },
};

describe('Team of the Week Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 11 players merged with bootstrap metadata', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);
    (fplClient.getDreamTeam as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTeamOfTheWeek);

    const result = await teamOfTheWeekService.getTeamOfTheWeek(1);

    expect(result.gw).toBe(1);
    expect(result.players).toHaveLength(11);
  });

  it('maps player fields correctly', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);
    (fplClient.getDreamTeam as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTeamOfTheWeek);

    const result = await teamOfTheWeekService.getTeamOfTheWeek(1);

    const gk = result.players.find((p) => p.id === 10)!;
    expect(gk.webName).toBe('Raya');
    expect(gk.position).toBe('GK');
    expect(gk.teamCode).toBe(3);
    expect(gk.teamShortName).toBe('ARS');
    expect(gk.points).toBe(10);
    expect(gk.pitchPosition).toBe(1);

    const fwd = result.players.find((p) => p.id === 90)!;
    expect(fwd.webName).toBe('Haaland');
    expect(fwd.position).toBe('FWD');
    expect(fwd.teamShortName).toBe('MCI');
    expect(fwd.points).toBe(20);
  });

  it('returns players sorted GK → DEF → MID → FWD', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);
    (fplClient.getDreamTeam as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTeamOfTheWeek);

    const result = await teamOfTheWeekService.getTeamOfTheWeek(1);

    const positions = result.players.map((p) => p.position);
    const firstGkIdx = positions.indexOf('GK');
    const firstDefIdx = positions.indexOf('DEF');
    const firstMidIdx = positions.indexOf('MID');
    const firstFwdIdx = positions.indexOf('FWD');

    expect(firstGkIdx).toBeLessThan(firstDefIdx);
    expect(firstDefIdx).toBeLessThan(firstMidIdx);
    expect(firstMidIdx).toBeLessThan(firstFwdIdx);
  });

  it('throws when gameweek not found', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ...mockBootstrap, events: [] });

    await expect(teamOfTheWeekService.getTeamOfTheWeek(1)).rejects.toThrow('Gameweek 1 not found');
  });

  it('throws when gameweek is not yet finished', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

    await expect(teamOfTheWeekService.getTeamOfTheWeek(2)).rejects.toThrow('not yet finished');
  });

  it('uses cached bootstrap data', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(mockBootstrap);
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);
    (fplClient.getDreamTeam as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTeamOfTheWeek);

    await teamOfTheWeekService.getTeamOfTheWeek(1);

    expect(fplClient.getBootstrapStatic).not.toHaveBeenCalled();
  });

  it('caches dream team data with SQUAD_FINISHED TTL', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);
    (fplClient.getDreamTeam as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTeamOfTheWeek);

    await teamOfTheWeekService.getTeamOfTheWeek(1);

    expect(cache.set).toHaveBeenCalledWith('team-of-the-week:1', mockTeamOfTheWeek, cache.ttl.SQUAD_FINISHED);
  });
});
