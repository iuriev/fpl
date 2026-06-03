import { createContext, useContext } from 'react';

export type PlayerWatchlistAddResult = 'ok' | 'duplicate' | 'limit';

export interface PlayerWatchlistRepository {
  list(): Promise<number[]>;
  add(playerId: number): Promise<PlayerWatchlistAddResult>;
  remove(playerId: number): Promise<void>;
  has(playerId: number): Promise<boolean>;
  getLimit(): number;
}

const STORAGE_KEY = 'fpl-player-watchlist-v1';
const FREE_LIMIT = 2;

export class LocalStoragePlayerWatchlistRepository implements PlayerWatchlistRepository {
  private read(): number[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'number') : [];
    } catch {
      return [];
    }
  }

  private write(ids: number[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }

  async list(): Promise<number[]> {
    return this.read();
  }

  async add(playerId: number): Promise<PlayerWatchlistAddResult> {
    const ids = this.read();
    if (ids.includes(playerId)) return 'duplicate';
    if (ids.length >= FREE_LIMIT) return 'limit';
    this.write([...ids, playerId]);
    return 'ok';
  }

  async remove(playerId: number): Promise<void> {
    this.write(this.read().filter((id) => id !== playerId));
  }

  async has(playerId: number): Promise<boolean> {
    return this.read().includes(playerId);
  }

  getLimit(): number {
    return FREE_LIMIT;
  }
}

export class ApiPlayerWatchlistRepository implements PlayerWatchlistRepository {
  private _cache: Promise<number[]> | null = null;

  async list(): Promise<number[]> {
    if (!this._cache) {
      this._cache = fetch('/api/me/player-watchlist', { credentials: 'include' }).then((res) => {
        if (!res.ok) { this._cache = null; throw new Error(`Player watchlist fetch failed: ${res.status}`); }
        return res.json().then((data: { playerIds: number[] }) => data.playerIds);
      });
    }
    return this._cache;
  }

  async add(playerId: number): Promise<PlayerWatchlistAddResult> {
    const res = await fetch('/api/me/player-watchlist', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    });
    if (res.ok) { this._cache = null; return 'ok'; }
    if (res.status === 409) {
      const body = (await res.json()) as { error: string };
      return body.error === 'duplicate' ? 'duplicate' : 'limit';
    }
    throw new Error(`Player watchlist add failed: ${res.status}`);
  }

  async remove(playerId: number): Promise<void> {
    const res = await fetch(`/api/me/player-watchlist/${playerId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok && res.status !== 204) throw new Error(`Player watchlist remove failed: ${res.status}`);
    this._cache = null;
  }

  async has(playerId: number): Promise<boolean> {
    const ids = await this.list();
    return ids.includes(playerId);
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
