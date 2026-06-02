import { createContext, useContext } from 'react';

export type AddResult = 'ok' | 'duplicate' | 'limit';

export interface WatchlistRepository {
  list(): Promise<number[]>;
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

  async list(): Promise<number[]> {
    return this.read();
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

export const WatchlistRepositoryContext = createContext<WatchlistRepository>(
  new LocalStorageWatchlistRepository(),
);

export function useWatchlistRepository(): WatchlistRepository {
  return useContext(WatchlistRepositoryContext);
}
