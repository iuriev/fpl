import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as cache from './cache';
import * as fplClient from './fpl-client';
import * as teamService from './team-service';

vi.mock('./fpl-client');
vi.mock('./cache');

const mockBootstrap = {
  total_players: 10000000,
  events: [
    { id: 1, name: 'Gameweek 1', finished: true, average_entry_score: 50, highest_score: 120, deadline_time: '2025-08-09T11:00:00Z', is_current: false },
  ],
  teams: [
    { id: 1, name: 'Arsenal', short_name: 'ARS', code: 3 },
    { id: 2, name: 'Man City', short_name: 'MCI', code: 43 },
    { id: 3, name: 'Chelsea', short_name: 'CHE', code: 8 },
  ],
  elements: [
    { id: 10, web_name: 'Raya', team: 1, team_code: 3, element_type: 1, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 80 },
    { id: 20, web_name: 'Saliba', team: 1, team_code: 3, element_type: 2, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 100 },
    { id: 30, web_name: 'Haaland', team: 2, team_code: 43, element_type: 4, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 200 },
    { id: 40, web_name: 'Saka', team: 1, team_code: 3, element_type: 3, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 150 },
    { id: 50, web_name: 'Palmer', team: 3, team_code: 8, element_type: 3, status: 'a', chance_of_playing_this_round: null, news: '', total_points: 170 },
  ],
  element_types: [
    { id: 1, singular_name_short: 'GKP' },
    { id: 2, singular_name_short: 'DEF' },
    { id: 3, singular_name_short: 'MID' },
    { id: 4, singular_name_short: 'FWD' },
  ],
};

describe('Team Service — getTeams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns teams sorted alphabetically by name', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

    const result = await teamService.getTeams();

    expect(result.teams.map((t) => t.name)).toEqual(['Arsenal', 'Chelsea', 'Man City']);
  });

  it('maps team fields correctly', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

    const result = await teamService.getTeams();

    const arsenal = result.teams.find((t) => t.name === 'Arsenal')!;
    expect(arsenal.id).toBe(1);
    expect(arsenal.code).toBe(3);
    expect(arsenal.shortName).toBe('ARS');
  });

  it('uses cached bootstrap when available', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(mockBootstrap);

    await teamService.getTeams();

    expect(fplClient.getBootstrapStatic).not.toHaveBeenCalled();
  });
});

describe('Team Service — getTeamPlayers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all players for the specified team', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

    const result = await teamService.getTeamPlayers(3);

    expect(result.players).toHaveLength(3);
    expect(result.players.map((p) => p.webName)).toContain('Raya');
    expect(result.players.map((p) => p.webName)).toContain('Saliba');
    expect(result.players.map((p) => p.webName)).toContain('Saka');
  });

  it('sorts players by total_points descending', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

    const result = await teamService.getTeamPlayers(3);

    expect(result.players[0].points).toBe(150);
    expect(result.players[1].points).toBe(100);
    expect(result.players[2].points).toBe(80);
  });

  it('sets team metadata on response', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

    const result = await teamService.getTeamPlayers(3);

    expect(result.teamCode).toBe(3);
    expect(result.teamName).toBe('Arsenal');
    expect(result.teamShortName).toBe('ARS');
  });

  it('maps player fields correctly', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

    const result = await teamService.getTeamPlayers(3);

    const saka = result.players.find((p) => p.webName === 'Saka')!;
    expect(saka.position).toBe('MID');
    expect(saka.teamCode).toBe(3);
    expect(saka.teamShortName).toBe('ARS');
  });

  it('throws when team code is not found', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockBootstrap);

    await expect(teamService.getTeamPlayers(999)).rejects.toThrow('not found');
  });

  it('returns empty players array when team has no elements', async () => {
    const bootstrapNoPlayers = {
      ...mockBootstrap,
      elements: mockBootstrap.elements.filter((e) => e.team_code !== 8),
    };
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getBootstrapStatic as ReturnType<typeof vi.fn>).mockResolvedValueOnce(bootstrapNoPlayers);

    const result = await teamService.getTeamPlayers(8);

    expect(result.players).toHaveLength(0);
  });
});
