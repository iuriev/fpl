import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { LocalStoragePlayerWatchlistRepository } from './player-watchlist-repository';

describe('LocalStoragePlayerWatchlistRepository', () => {
  let repo: LocalStoragePlayerWatchlistRepository;

  beforeEach(() => {
    localStorage.removeItem('fpl-player-watchlist-v1');
    repo = new LocalStoragePlayerWatchlistRepository();
  });

  afterEach(() => {
    localStorage.removeItem('fpl-player-watchlist-v1');
  });

  it('starts empty', async () => {
    expect(await repo.list()).toEqual([]);
  });

  it('adds a player ID', async () => {
    await repo.add(123);
    expect(await repo.list()).toEqual([123]);
  });

  it('returns ok on successful add', async () => {
    expect(await repo.add(123)).toBe('ok');
  });

  it('returns duplicate when adding the same ID twice', async () => {
    await repo.add(123);
    expect(await repo.add(123)).toBe('duplicate');
    expect(await repo.list()).toEqual([123]);
  });

  it('returns limit when at max capacity (2)', async () => {
    await repo.add(1);
    await repo.add(2);
    expect(await repo.add(3)).toBe('limit');
    expect(await repo.list()).toHaveLength(2);
  });

  it('removes a player ID', async () => {
    await repo.add(1);
    await repo.add(2);
    await repo.remove(1);
    expect(await repo.list()).toEqual([2]);
  });

  it('remove is a no-op for unknown ID', async () => {
    await repo.add(1);
    await repo.remove(999);
    expect(await repo.list()).toEqual([1]);
  });

  it('has() returns true for followed player', async () => {
    await repo.add(1);
    expect(await repo.has(1)).toBe(true);
  });

  it('has() returns false for unfollowed player', async () => {
    expect(await repo.has(999)).toBe(false);
  });

  it('persists across new instances (same localStorage)', async () => {
    await repo.add(1);
    await repo.add(2);
    const repo2 = new LocalStoragePlayerWatchlistRepository();
    expect(await repo2.list()).toEqual([1, 2]);
  });

  it('getLimit returns 2', () => {
    expect(repo.getLimit()).toBe(2);
  });

  it('handles corrupt localStorage gracefully', async () => {
    localStorage.setItem('fpl-player-watchlist-v1', 'not-json{{');
    const freshRepo = new LocalStoragePlayerWatchlistRepository();
    expect(await freshRepo.list()).toEqual([]);
  });
});
