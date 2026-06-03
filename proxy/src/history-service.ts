import { db } from './db/client';
import { getOrFetchBootstrap, getOrFetchHistory, getSeasonMeta } from './fpl-cache/db-cache';
import { deriveSeason } from './fpl-cache/season';
import type { HistoryResponse } from './types';

export async function getHistory(teamId: number): Promise<HistoryResponse> {
  const bootstrap = await getOrFetchBootstrap(db);
  const season = deriveSeason(bootstrap.events);
  const { isComplete } = await getSeasonMeta(db, season);

  const history = await getOrFetchHistory(db, season, teamId, bootstrap.events, isComplete);

  const gameweeks = [...history.current].reverse().map((row) => ({
    gw: row.event,
    overallRank: row.overall_rank,
    overallPoints: row.total_points,
    gwRank: row.rank,
    gwPoints: row.points,
    pointsOnBench: row.points_on_bench,
    transfers: row.event_transfers,
    transferCost: row.event_transfers_cost,
    teamValue: row.value / 10,
  }));

  return { teamId, gameweeks };
}
