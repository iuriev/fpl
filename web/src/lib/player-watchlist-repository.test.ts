import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ApiPlayerWatchlistRepository,
  LocalStoragePlayerWatchlistRepository,
} from './player-watchlist-repository';

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

describe('ApiPlayerWatchlistRepository', () => {
  let repo: ApiPlayerWatchlistRepository;

  beforeEach(() => {
    repo = new ApiPlayerWatchlistRepository();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockFetch(status: number, body: unknown) {
    vi.mocked(fetch).mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    } as Response);
  }

  it('list() returns playerIds from API', async () => {
    mockFetch(200, { playerIds: [300, 400] });
    expect(await repo.list()).toEqual([300, 400]);
  });

  it('list() returns empty array when API returns empty', async () => {
    mockFetch(200, { playerIds: [] });
    expect(await repo.list()).toEqual([]);
  });

  it('add() returns ok on 200', async () => {
    mockFetch(200, { playerId: 300 });
    expect(await repo.add(300)).toBe('ok');
  });

  it('add() returns limit on 409 limit', async () => {
    mockFetch(409, { error: 'limit' });
    expect(await repo.add(300)).toBe('limit');
  });

  it('add() returns duplicate on 409 duplicate', async () => {
    mockFetch(409, { error: 'duplicate' });
    expect(await repo.add(300)).toBe('duplicate');
  });

  it('remove() calls DELETE endpoint', async () => {
    mockFetch(204, null);
    await repo.remove(300);
    expect(fetch).toHaveBeenCalledWith(
      '/api/me/player-watchlist/300',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('has() returns true when playerId is in list', async () => {
    mockFetch(200, { playerIds: [300, 400] });
    expect(await repo.has(300)).toBe(true);
  });

  it('has() returns false when playerId is not in list', async () => {
    mockFetch(200, { playerIds: [300, 400] });
    expect(await repo.has(999)).toBe(false);
  });

  it('getLimit() returns 2', () => {
    expect(repo.getLimit()).toBe(2);
  });

  it('list() deduplicates concurrent calls — only one fetch', async () => {
    mockFetch(200, { playerIds: [300] });
    await Promise.all([repo.list(), repo.list(), repo.list()]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('list() refetches on sequential calls', async () => {
    mockFetch(200, { playerIds: [300] });
    await repo.list();
    await repo.list();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('cache is invalidated after add()', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ playerIds: [] }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ playerId: 300 }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ playerIds: [300] }) } as Response);
    await repo.list();
    await repo.add(300);
    const ids = await repo.list();
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(ids).toEqual([300]);
  });

  it('cache is invalidated after remove()', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ playerIds: [300] }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 204, json: () => Promise.resolve(null) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ playerIds: [] }) } as Response);
    await repo.list();
    await repo.remove(300);
    const ids = await repo.list();
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(ids).toEqual([]);
  });
});
