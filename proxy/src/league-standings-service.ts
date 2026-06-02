import * as cacheLayer from './cache';
import * as fplClient from './fpl-client';
import type { LeagueStandingsResponse } from './types';

const TTL_STANDINGS = 600;

export async function getLeagueStandings(
  leagueId: number,
  page: number
): Promise<LeagueStandingsResponse> {
  const cacheKey = `league-standings:${leagueId}:${page}`;
  const cached = cacheLayer.get<LeagueStandingsResponse>(cacheKey);
  if (cached) return cached;

  const data = await fplClient.getLeagueStandings(leagueId, page);

  const result: LeagueStandingsResponse = {
    leagueId,
    leagueName: data.league.name,
    page,
    hasNext: data.standings.has_next,
    standings: data.standings.results.map((r) => ({
      entry: r.entry,
      entryName: r.entry_name,
      playerName: r.player_name,
      rank: r.rank,
      lastRank: r.last_rank,
      total: r.total,
      eventTotal: r.event_total,
    })),
  };

  cacheLayer.set(cacheKey, result, TTL_STANDINGS);
  return result;
}
