/**
 * Simple in-memory cache with TTL support.
 * Default TTLs per D2:
 * - bootstrap-static: 1 hour (3600s)
 * - entry: 1 hour (3600s)
 * - finished gameweek squad: 24 hours (86400s)
 * - current gameweek squad: 60 seconds
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
  BOOTSTRAP: 3600,
  ENTRY: 3600,
  SQUAD_FINISHED: 86400,
  SQUAD_CURRENT: 60,
  HISTORY_FINISHED: 86400,
  HISTORY_CURRENT: 60,
};
