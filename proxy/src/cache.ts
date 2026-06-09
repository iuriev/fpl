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

export function remove(key: string): void {
  cache.delete(key);
}

export function clearCache(): void {
  cache.clear();
}

export const ttl = {
  BOOTSTRAP: 3600,
  ENTRY: 86400,
  FIXTURES: 3600,
  PLAYER_POOL: 3600,
  CALENDAR: 43200,
  PREDICTED_LINEUPS: 600,
  ELEMENT_SUMMARY: 43200,
};
