/**
 * Entry service — fetches team and manager data.
 */

import * as fplClient from './fpl-client';
import * as cacheLayer from './cache';
import type { EntryResponse } from './types';

export async function getEntry(teamId: number): Promise<EntryResponse> {
  const cacheKey = `entry:${teamId}`;
  const cached = cacheLayer.get<EntryResponse>(cacheKey);
  if (cached) return cached;

  const entry = await fplClient.getEntry(teamId);
  const managerName = `${entry.player_first_name} ${entry.player_last_name}`;

  const result: EntryResponse = {
    teamId: entry.id,
    teamName: entry.name,
    managerName,
  };

  cacheLayer.set(cacheKey, result, cacheLayer.ttl.ENTRY);
  return result;
}
