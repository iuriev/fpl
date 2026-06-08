import { createContext, useContext } from 'react';

export type PlayerWatchlistAddResult = 'ok' | 'duplicate' | 'limit';

export interface PlayerWatchlistRepository {
  list(): Promise<number[]>;
  add(fplCode: number): Promise<PlayerWatchlistAddResult>;
  remove(fplCode: number): Promise<void>;
  has(fplCode: number): Promise<boolean>;
  getLimit(): number;
  invalidateCache(): void;
}

const STORAGE_KEY = 'fpl-player-watchlist-v2';
const LEGACY_STORAGE_KEY = 'fpl-player-watchlist-v1';
const FREE_LIMIT = 2;

function migrateLegacyStorage(): number[] {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const codes = parsed.filter((x) => typeof x === 'number');
    if (codes.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
    }
    return codes;
  } catch {
    return [];
  }
}

export class LocalStoragePlayerWatchlistRepository implements PlayerWatchlistRepository {
  private read(): number[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return migrateLegacyStorage();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'number') : [];
    } catch {
      return [];
    }
  }

  private write(codes: number[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  }

  async list(): Promise<number[]> {
    return this.read();
  }

  async add(fplCode: number): Promise<PlayerWatchlistAddResult> {
    const codes = this.read();
    if (codes.includes(fplCode)) return 'duplicate';
    if (codes.length >= FREE_LIMIT) return 'limit';
    this.write([...codes, fplCode]);
    return 'ok';
  }

  async remove(fplCode: number): Promise<void> {
    this.write(this.read().filter((code) => code !== fplCode));
  }

  async has(fplCode: number): Promise<boolean> {
    return this.read().includes(fplCode);
  }

  getLimit(): number {
    return FREE_LIMIT;
  }

  invalidateCache(): void {}
}

export class ApiPlayerWatchlistRepository implements PlayerWatchlistRepository {
  private _inflight: Promise<number[]> | null = null;

  invalidateCache(): void {
    this._inflight = null;
  }

  async list(): Promise<number[]> {
    if (!this._inflight) {
      this._inflight = fetch('/api/me/player-watchlist', { credentials: 'include' })
        .then((res) => {
          if (!res.ok) throw new Error(`Player watchlist fetch failed: ${res.status}`);
          return res.json().then((data: { fplCodes: number[] }) => data.fplCodes);
        })
        .finally(() => {
          this._inflight = null;
        });
    }
    return this._inflight;
  }

  async add(fplCode: number): Promise<PlayerWatchlistAddResult> {
    this.invalidateCache();
    const res = await fetch('/api/me/player-watchlist', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fplCode }),
    });
    if (res.ok) {
      this.invalidateCache();
      return 'ok';
    }
    if (res.status === 409) {
      const body = (await res.json()) as { error: string };
      return body.error === 'duplicate' ? 'duplicate' : 'limit';
    }
    throw new Error(`Player watchlist add failed: ${res.status}`);
  }

  async remove(fplCode: number): Promise<void> {
    const res = await fetch(`/api/me/player-watchlist/${fplCode}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok && res.status !== 204) throw new Error(`Player watchlist remove failed: ${res.status}`);
    this.invalidateCache();
  }

  async has(fplCode: number): Promise<boolean> {
    const codes = await this.list();
    return codes.includes(fplCode);
  }

  getLimit(): number {
    return 2;
  }
}

export const PlayerWatchlistRepositoryContext = createContext<PlayerWatchlistRepository>(
  new LocalStoragePlayerWatchlistRepository(),
);

export function usePlayerWatchlistRepository(): PlayerWatchlistRepository {
  return useContext(PlayerWatchlistRepositoryContext);
}
