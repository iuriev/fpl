import * as fplClient from './fpl-client';
import * as cacheLayer from './cache';
import type { FPLBootstrapStatic } from './fpl-client';
import type { HistoryResponse } from './types';

async function getBootstrapWithCache(): Promise<FPLBootstrapStatic> {
  const cached = cacheLayer.get<FPLBootstrapStatic>('bootstrap-static');
  if (cached) return cached;
  const bootstrap = await fplClient.getBootstrapStatic();
  cacheLayer.set('bootstrap-static', bootstrap, cacheLayer.ttl.BOOTSTRAP);
  return bootstrap;
}

export async function getHistory(teamId: number): Promise<HistoryResponse> {
  const cacheKey = `history:${teamId}`;
  const cached = cacheLayer.get<HistoryResponse>(cacheKey);
  if (cached) return cached;

  const [history, bootstrap] = await Promise.all([
    fplClient.getHistory(teamId),
    getBootstrapWithCache(),
  ]);

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

  const result: HistoryResponse = { teamId, gameweeks };

  const currentEvent = bootstrap.events.find((e) => e.is_current);
  const isFinished = currentEvent?.finished ?? false;
  cacheLayer.set(
    cacheKey,
    result,
    isFinished ? cacheLayer.ttl.HISTORY_FINISHED : cacheLayer.ttl.HISTORY_CURRENT,
  );

  return result;
}
