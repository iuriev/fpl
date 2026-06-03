import { createContext, useContext } from 'react';

export type AddResult = 'ok' | 'duplicate' | 'limit';

export interface WatchedManager {
  teamId: number;
  teamName?: string;
  managerName?: string;
  overallPoints?: number;
  overallRank?: number;
  eventPoints?: number;
  eventRank?: number;
  totalPlayers?: number;
  regionIsoCode?: string;
}

export interface WatchlistRepository {
  list(): Promise<WatchedManager[]>;
  add(teamId: number): Promise<AddResult>;
  remove(teamId: number): Promise<void>;
  has(teamId: number): Promise<boolean>;
  getLimit(): number;
}

const STORAGE_KEY = 'fpl-watchlist-v1';
const FREE_LIMIT = 2;

export class LocalStorageWatchlistRepository implements WatchlistRepository {
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

  async list(): Promise<WatchedManager[]> {
    return this.read().map((teamId) => ({ teamId }));
  }

  async add(teamId: number): Promise<AddResult> {
    const ids = this.read();
    if (ids.includes(teamId)) return 'duplicate';
    if (ids.length >= FREE_LIMIT) return 'limit';
    this.write([...ids, teamId]);
    return 'ok';
  }

  async remove(teamId: number): Promise<void> {
    this.write(this.read().filter((id) => id !== teamId));
  }

  async has(teamId: number): Promise<boolean> {
    return this.read().includes(teamId);
  }

  getLimit(): number {
    return FREE_LIMIT;
  }
}

export class ApiWatchlistRepository implements WatchlistRepository {
  private _cache: Promise<WatchedManager[]> | null = null;

  async list(): Promise<WatchedManager[]> {
    if (!this._cache) {
      this._cache = fetch('/api/me/managers-watchlist', { credentials: 'include' }).then((res) => {
        if (!res.ok) { this._cache = null; throw new Error(`Watchlist fetch failed: ${res.status}`); }
        return res.json().then((data: { managers: WatchedManager[] }) => data.managers);
      });
    }
    return this._cache;
  }

  async add(teamId: number): Promise<AddResult> {
    const res = await fetch('/api/me/managers-watchlist', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId }),
    });
    if (res.ok) { this._cache = null; return 'ok'; }
    if (res.status === 409) {
      const body = (await res.json()) as { error: string };
      return body.error === 'duplicate' ? 'duplicate' : 'limit';
    }
    throw new Error(`Watchlist add failed: ${res.status}`);
  }

  async remove(teamId: number): Promise<void> {
    const res = await fetch(`/api/me/managers-watchlist/${teamId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok && res.status !== 204) throw new Error(`Watchlist remove failed: ${res.status}`);
    this._cache = null;
  }

  async has(teamId: number): Promise<boolean> {
    const managers = await this.list();
    return managers.some((m) => m.teamId === teamId);
  }

  getLimit(): number {
    return 2;
  }
}

export const WatchlistRepositoryContext = createContext<WatchlistRepository>(
  new LocalStorageWatchlistRepository(),
);

export function useWatchlistRepository(): WatchlistRepository {
  return useContext(WatchlistRepositoryContext);
}
