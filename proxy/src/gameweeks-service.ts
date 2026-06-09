import { db } from './db/client';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
import { resolveNextGw } from './resolve-next-gw';
import type { GameweeksResponse } from './types';

export async function getGameweeks(): Promise<GameweeksResponse> {
  const bootstrap = await getOrFetchBootstrap(db);

  // D3: current = flagged current, or latest finished (off-season)
  let current = bootstrap.events.find((e) => e.is_current)?.id;
  if (!current) {
    const finished = bootstrap.events.filter((e) => e.finished);
    current = finished.length > 0 ? finished[finished.length - 1].id : 1;
  }

  const gameweeks = bootstrap.events.map((e) => ({
    id: e.id,
    name: e.name,
    finished: e.finished,
    averageScore: e.average_entry_score > 0 ? e.average_entry_score : undefined,
    highestScore: e.highest_score > 0 ? e.highest_score : undefined,
  }));

  const next = resolveNextGw(bootstrap);

  return { current, next, gameweeks };
}
