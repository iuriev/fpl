import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { LocalStorageWatchlistRepository } from './watchlist-repository';

describe('LocalStorageWatchlistRepository', () => {
  let repo: LocalStorageWatchlistRepository;

  beforeEach(() => {
    localStorage.removeItem('fpl-watchlist-v1');
    repo = new LocalStorageWatchlistRepository();
  });

  afterEach(() => {
    localStorage.removeItem('fpl-watchlist-v1');
  });

  it('starts empty', async () => {
    expect(await repo.list()).toEqual([]);
  });

  it('adds a team ID', async () => {
    await repo.add(123456);
    expect(await repo.list()).toEqual([123456]);
  });

  it('returns ok on successful add', async () => {
    expect(await repo.add(123456)).toBe('ok');
  });

  it('returns duplicate when adding the same ID twice', async () => {
    await repo.add(123456);
    expect(await repo.add(123456)).toBe('duplicate');
    expect(await repo.list()).toEqual([123456]);
  });

  it('returns limit when at max capacity (5)', async () => {
    for (let i = 1; i <= 5; i++) {
      await repo.add(i);
    }
    expect(await repo.add(6)).toBe('limit');
    expect(await repo.list()).toHaveLength(5);
  });

  it('removes a team ID', async () => {
    await repo.add(111);
    await repo.add(222);
    await repo.remove(111);
    expect(await repo.list()).toEqual([222]);
  });

  it('remove is a no-op for unknown ID', async () => {
    await repo.add(111);
    await repo.remove(999);
    expect(await repo.list()).toEqual([111]);
  });

  it('has() returns true for followed team', async () => {
    await repo.add(111);
    expect(await repo.has(111)).toBe(true);
  });

  it('has() returns false for unfollowed team', async () => {
    expect(await repo.has(999)).toBe(false);
  });

  it('persists across new instances (same localStorage)', async () => {
    await repo.add(111);
    await repo.add(222);
    const repo2 = new LocalStorageWatchlistRepository();
    expect(await repo2.list()).toEqual([111, 222]);
  });

  it('getLimit returns 5', () => {
    expect(repo.getLimit()).toBe(5);
  });

  it('handles corrupt localStorage gracefully', async () => {
    localStorage.setItem('fpl-watchlist-v1', 'not-json{{');
    const freshRepo = new LocalStorageWatchlistRepository();
    expect(await freshRepo.list()).toEqual([]);
  });
});
