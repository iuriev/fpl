import { db } from './db/client';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
import type { FPLBootstrapStatic } from './fpl-client';
import type { PlayerPosition } from './types';

export const POSITION_MAP: Record<number, PlayerPosition> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

export type PositionFilter = 'all' | PlayerPosition;

export const TOP_PRICE_LIST = 50;

export async function getBootstrapWithCache(): Promise<FPLBootstrapStatic> {
  return getOrFetchBootstrap(db);
}

export function matchesPosition(elementType: number, position: PositionFilter): boolean {
  if (position === 'all') return true;
  return POSITION_MAP[elementType] === position;
}

export function latestFinishedGw(bootstrap: FPLBootstrapStatic): number | null {
  const finished = bootstrap.events.filter((e) => e.finished);
  if (finished.length === 0) return null;
  return finished[finished.length - 1].id;
}
