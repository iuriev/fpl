/**
 * Simple in-memory cache with TTL support.
 * Default TTLs per D2:
 * - bootstrap-static: 1 hour (3600s)
 * - entry: 1 hour (3600s)
 * - finished gameweek squad: 24 hours (86400s)
 * - current gameweek squad: 300 seconds (5 minutes)
 */

interface CacheEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export function get<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function set<T>(key: string, data: T, ttlSeconds: number): void {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  cache.set(key, { data, expiresAt });
}

export const ttl = {
  BOOTSTRAP: 7200,
  ENTRY: 86400,
  SQUAD_FINISHED: 604800,
  SQUAD_CURRENT: 300,
  HISTORY_FINISHED: 604800,
  HISTORY_CURRENT: 300,
  FIXTURES: 3600,
  PLAYER_POOL: 3600,
  LEADERBOARD_GW_FINISHED: 3600,
  LEADERBOARD_GW_LIVE: 120,
  LEADERBOARD_SEASON: 1800,
};
