import * as cacheLayer from './cache';
import type { FPLBootstrapStatic } from './fpl-client';
import * as fplClient from './fpl-client';
import type { TransfersResponse } from './types';

const TTL_TRANSFERS = 3600;

async function getBootstrapWithCache(): Promise<FPLBootstrapStatic> {
  const cached = cacheLayer.get<FPLBootstrapStatic>('bootstrap-static');
  if (cached) return cached;
  const bootstrap = await fplClient.getBootstrapStatic();
  cacheLayer.set('bootstrap-static', bootstrap, cacheLayer.ttl.BOOTSTRAP);
  return bootstrap;
}

export async function getTransfers(teamId: number): Promise<TransfersResponse> {
  const cacheKey = `transfers:${teamId}`;
  const cached = cacheLayer.get<TransfersResponse>(cacheKey);
  if (cached) return cached;

  const [transfers, bootstrap] = await Promise.all([
    fplClient.getTransfers(teamId),
    getBootstrapWithCache(),
  ]);

  const playerMap = new Map<number, string>(
    bootstrap.elements.map((e) => [e.id, e.web_name]),
  );

  const result: TransfersResponse = {
    teamId,
    transfers: transfers.map((t) => ({
      event: t.event,
      elementIn: t.element_in,
      elementInName: playerMap.get(t.element_in) ?? String(t.element_in),
      elementOut: t.element_out,
      elementOutName: playerMap.get(t.element_out) ?? String(t.element_out),
      elementInCost: t.element_in_cost,
      elementOutCost: t.element_out_cost,
      time: t.time,
    })),
  };

  cacheLayer.set(cacheKey, result, TTL_TRANSFERS);
  return result;
}
