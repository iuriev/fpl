import * as fplClient from './fpl-client';
import * as cacheLayer from './cache';
import type { LeaguesResponse } from './types';

export async function getLeagues(teamId: number): Promise<LeaguesResponse> {
  const cacheKey = `leagues:${teamId}`;
  const cached = cacheLayer.get<LeaguesResponse>(cacheKey);
  if (cached) return cached;

  const entry = await fplClient.getEntry(teamId);

  const mapLeague = (l: fplClient.FPLLeagueEntry) => ({
    id: l.id,
    name: l.name,
    rank: l.entry_rank,
    lastRank: l.entry_last_rank,
  });

  const result: LeaguesResponse = {
    teamId,
    classic: entry.leagues.classic.map(mapLeague),
    h2h: entry.leagues.h2h.map(mapLeague),
  };

  cacheLayer.set(cacheKey, result, cacheLayer.ttl.ENTRY);
  return result;
}
