import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as cacheLayer from './cache';
import * as dbCache from './fpl-cache/db-cache';
import * as fplClient from './fpl-client';
import { FIXTURES_ALL_MEM_KEY, getOrFetchAllFixtures } from './fpl-fixtures-cache';

vi.mock('./db/client', () => ({ db: {} }));
vi.mock('./fpl-cache/db-cache');
vi.mock('./fpl-client');

const FIXTURES = [{ id: 1 }] as Awaited<ReturnType<typeof fplClient.getFixturesAll>>;

const bootstrap = {
  events: [
    {
      id: 1,
      name: 'GW1',
      deadline_time: '2025-08-16T11:00:00Z',
      is_current: false,
      is_next: false,
      finished: true,
      data_checked: true,
      average_entry_score: 0,
      highest_score: 0,
    },
    {
      id: 38,
      name: 'GW38',
      deadline_time: '2026-05-01T11:00:00Z',
      is_current: false,
      is_next: false,
      finished: true,
      data_checked: true,
      average_entry_score: 0,
      highest_score: 0,
    },
  ],
  teams: [],
  elements: [],
  element_types: [],
  total_players: 0,
  chips: [],
} as unknown as Awaited<ReturnType<typeof dbCache.getOrFetchBootstrap>>;

describe('getOrFetchAllFixtures', () => {
  beforeEach(() => {
    cacheLayer.clearCache();
    vi.clearAllMocks();
    vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValue(bootstrap);
    vi.mocked(dbCache.getSeasonMeta).mockResolvedValue({ isComplete: true });
    vi.mocked(fplClient.getFixturesAll).mockResolvedValue(FIXTURES);
  });

  it('stores result under fixtures:all in memory', async () => {
    vi.mocked(dbCache.getSeasonMeta).mockResolvedValue({ isComplete: false });
    const db = {} as Parameters<typeof getOrFetchAllFixtures>[0];
    await getOrFetchAllFixtures(db);

    expect(cacheLayer.get(FIXTURES_ALL_MEM_KEY)).toEqual(FIXTURES);
    expect(fplClient.getFixturesAll).toHaveBeenCalledOnce();
  });

  it('returns memory cache without calling FPL', async () => {
    const db = {} as Parameters<typeof getOrFetchAllFixtures>[0];
    cacheLayer.set(FIXTURES_ALL_MEM_KEY, FIXTURES, 3600);

    const result = await getOrFetchAllFixtures(db);

    expect(result).toEqual(FIXTURES);
    expect(fplClient.getFixturesAll).not.toHaveBeenCalled();
  });
});
