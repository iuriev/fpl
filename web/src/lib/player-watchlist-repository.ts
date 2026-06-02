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

export const PlayerWatchlistRepositoryContext = createContext<PlayerWatchlistRepository>(
  new LocalStoragePlayerWatchlistRepository(),
);

export function usePlayerWatchlistRepository(): PlayerWatchlistRepository {
  return useContext(PlayerWatchlistRepositoryContext);
}
