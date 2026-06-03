import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiWatchlistRepository, LocalStorageWatchlistRepository } from './watchlist-repository';

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

  it('returns limit when at max capacity (2)', async () => {
    for (let i = 1; i <= 2; i++) {
      await repo.add(i);
    }
    expect(await repo.add(3)).toBe('limit');
    expect(await repo.list()).toHaveLength(2);
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

  it('getLimit returns 2', () => {
    expect(repo.getLimit()).toBe(2);
  });

  it('handles corrupt localStorage gracefully', async () => {
    localStorage.setItem('fpl-watchlist-v1', 'not-json{{');
    const freshRepo = new LocalStorageWatchlistRepository();
    expect(await freshRepo.list()).toEqual([]);
  });
});

describe('ApiWatchlistRepository', () => {
  let repo: ApiWatchlistRepository;

  beforeEach(() => {
    repo = new ApiWatchlistRepository();
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

  it('list() returns teamIds from API', async () => {
    mockFetch(200, { teamIds: [100, 200] });
    expect(await repo.list()).toEqual([100, 200]);
  });

  it('list() returns empty array when API returns empty', async () => {
    mockFetch(200, { teamIds: [] });
    expect(await repo.list()).toEqual([]);
  });

  it('add() returns ok on 200', async () => {
    mockFetch(200, { teamId: 123 });
    expect(await repo.add(123)).toBe('ok');
  });

  it('add() returns limit on 409 limit', async () => {
    mockFetch(409, { error: 'limit' });
    expect(await repo.add(123)).toBe('limit');
  });

  it('add() returns duplicate on 409 duplicate', async () => {
    mockFetch(409, { error: 'duplicate' });
    expect(await repo.add(123)).toBe('duplicate');
  });

  it('remove() calls DELETE endpoint', async () => {
    mockFetch(204, null);
    await repo.remove(123);
    expect(fetch).toHaveBeenCalledWith('/api/me/watchlist/123', expect.objectContaining({ method: 'DELETE' }));
  });

  it('has() returns true when teamId is in list', async () => {
    mockFetch(200, { teamIds: [100, 200] });
    expect(await repo.has(100)).toBe(true);
  });

  it('has() returns false when teamId is not in list', async () => {
    mockFetch(200, { teamIds: [100, 200] });
    expect(await repo.has(999)).toBe(false);
  });

  it('getLimit() returns 2', () => {
    expect(repo.getLimit()).toBe(2);
  });

  it('list() deduplicates concurrent calls — only one fetch', async () => {
    mockFetch(200, { teamIds: [100] });
    await Promise.all([repo.list(), repo.list(), repo.list()]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('list() returns cached result on repeated calls', async () => {
    mockFetch(200, { teamIds: [100] });
    await repo.list();
    await repo.list();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('cache is invalidated after add()', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ teamIds: [] }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ teamId: 100 }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ teamIds: [100] }) } as Response);
    await repo.list();
    await repo.add(100);
    const ids = await repo.list();
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(ids).toEqual([100]);
  });

  it('cache is invalidated after remove()', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ teamIds: [100] }) } as Response)
      .mockResolvedValueOnce({ ok: false, status: 204, json: () => Promise.resolve(null) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ teamIds: [] }) } as Response);
    await repo.list();
    await repo.remove(100);
    const ids = await repo.list();
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(ids).toEqual([]);
  });
});
