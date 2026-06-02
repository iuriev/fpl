import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as cache from './cache';
import * as fplClient from './fpl-client';
import * as leagueStandingsService from './league-standings-service';

vi.mock('./fpl-client');
vi.mock('./cache');

const mockStandingsResponse = {
  league: { id: 314, name: 'My Mini League' },
  standings: {
    has_next: true,
    results: [
      { entry: 111, entry_name: 'Top Squad', player_name: 'Alice Smith', rank: 1, last_rank: 2, total: 2200, event_total: 85 },
      { entry: 222, entry_name: 'Dream XI', player_name: 'Bob Jones', rank: 2, last_rank: 1, total: 2150, event_total: 70 },
    ],
  },
};

describe('League Standings Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches standings and maps response correctly', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getLeagueStandings as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockStandingsResponse);

    const result = await leagueStandingsService.getLeagueStandings(314, 1);

    expect(result).toEqual({
      leagueId: 314,
      leagueName: 'My Mini League',
      page: 1,
      hasNext: true,
      standings: [
        { entry: 111, entryName: 'Top Squad', playerName: 'Alice Smith', rank: 1, lastRank: 2, total: 2200, eventTotal: 85 },
        { entry: 222, entryName: 'Dream XI', playerName: 'Bob Jones', rank: 2, lastRank: 1, total: 2150, eventTotal: 70 },
      ],
    });
    expect(fplClient.getLeagueStandings).toHaveBeenCalledWith(314, 1);
  });

  it('forwards page number to FPL client', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getLeagueStandings as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...mockStandingsResponse,
      standings: { has_next: false, results: [] },
    });

    await leagueStandingsService.getLeagueStandings(314, 3);

    expect(fplClient.getLeagueStandings).toHaveBeenCalledWith(314, 3);
  });

  it('reflects hasNext: false when last page', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getLeagueStandings as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...mockStandingsResponse,
      standings: { has_next: false, results: [] },
    });

    const result = await leagueStandingsService.getLeagueStandings(314, 1);

    expect(result.hasNext).toBe(false);
  });

  it('returns cached result when available', async () => {
    const cached = { leagueId: 314, leagueName: 'Cached', page: 1, hasNext: false, standings: [] };
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(cached);

    const result = await leagueStandingsService.getLeagueStandings(314, 1);

    expect(result).toEqual(cached);
    expect(fplClient.getLeagueStandings).not.toHaveBeenCalled();
  });

  it('propagates 404 for unknown league', async () => {
    (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (fplClient.getLeagueStandings as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('FPL API error: 404 Not Found'),
    );

    await expect(leagueStandingsService.getLeagueStandings(99999, 1)).rejects.toThrow('404');
  });
});
