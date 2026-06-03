import { db } from './db/client';
import { getOrFetchBootstrap, getOrFetchTransfers, getSeasonMeta } from './fpl-cache/db-cache';
import { deriveSeason } from './fpl-cache/season';
import type { TransfersResponse } from './types';

export async function getTransfers(teamId: number): Promise<TransfersResponse> {
  const bootstrap = await getOrFetchBootstrap(db);
  const season = deriveSeason(bootstrap.events);
  const { isComplete } = await getSeasonMeta(db, season);

  const transfers = await getOrFetchTransfers(db, season, teamId, bootstrap.events, isComplete);

  const playerMap = new Map<number, string>(bootstrap.elements.map((e) => [e.id, e.web_name]));

  return {
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
}
