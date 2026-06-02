import * as cacheLayer from './cache';
import type { FPLBootstrapStatic } from './fpl-client';
import * as fplClient from './fpl-client';
import type { EntryResponse } from './types';

async function getBootstrapWithCache(): Promise<FPLBootstrapStatic> {
  const cached = cacheLayer.get<FPLBootstrapStatic>('bootstrap-static');
  if (cached) return cached;
  const bootstrap = await fplClient.getBootstrapStatic();
  cacheLayer.set('bootstrap-static', bootstrap, cacheLayer.ttl.BOOTSTRAP);
  return bootstrap;
}

export async function getEntry(teamId: number): Promise<EntryResponse> {
  const cacheKey = `entry:${teamId}`;
  const cached = cacheLayer.get<EntryResponse>(cacheKey);
  if (cached) return cached;

  const [entry, bootstrap] = await Promise.all([
    fplClient.getEntry(teamId),
    getBootstrapWithCache(),
  ]);

  const result: EntryResponse = {
    teamId: entry.id,
    teamName: entry.name,
    managerName: `${entry.player_first_name} ${entry.player_last_name}`,
    overallPoints: entry.summary_overall_points,
    overallRank: entry.summary_overall_rank,
    eventPoints: entry.summary_event_points,
    eventRank: entry.summary_event_rank,
    totalPlayers: bootstrap.total_players,
    ...(entry.player_region_iso_code_short
      ? { regionIsoCode: entry.player_region_iso_code_short }
      : {}),
  };

  cacheLayer.set(cacheKey, result, cacheLayer.ttl.ENTRY);
  return result;
}
