import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as cache from '../cache';
import type { FPLBootstrapStatic } from '../fpl-client';
import * as fplClient from '../fpl-client';
import {
  getOrFetchBootstrap,
  getOrFetchGwLive,
  getOrFetchHistory,
  getOrFetchSquad,
  getOrFetchTransfers,
} from './db-cache';

vi.mock('../fpl-client');

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Event = FPLBootstrapStatic['events'][0];

function makeEvent(overrides: Partial<Event> & { id: number }): Event {
  return {
    name: `Gameweek ${overrides.id}`,
    deadline_time: '2025-08-16T11:00:00Z',
    is_current: false,
    is_next: false,
    finished: false,
    data_checked: false,
    average_entry_score: 0,
    highest_score: 0,
    ...overrides,
  };
}

function makeBootstrap(eventOverrides: Partial<Event>[] = []): FPLBootstrapStatic {
  const base = Array.from({ length: 38 }, (_, i) => makeEvent({ id: i + 1 }));
  eventOverrides.forEach((o) => {
    const idx = base.findIndex((e) => e.id === o.id);
    if (idx >= 0) base[idx] = { ...base[idx], ...o };
  });
  return {
    total_players: 0,
    events: base,
    teams: [],
    chips: [],
    elements: [],
    element_types: [],
  };
}

function freshTimestamp() {
  return new Date(Date.now() - 60 * 1000); // 1 minute ago — within any TTL
}

function staleTimestamp() {
  return new Date(Date.now() - 200 * 3600 * 1000); // 200 hours ago — outside all TTLs including 7-day pre-season
}

// ─── Mock DB factory ─────────────────────────────────────────────────────────

function makeMockDb(overrides: Record<string, unknown> = {}) {
  const insertResult = { onConflictDoNothing: vi.fn(), onConflictDoUpdate: vi.fn() };
  const updateResult = { set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue(undefined) };

  const db = {
    _selectResults: [] as unknown[],
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation(function (this: typeof db) {
      return Promise.resolve(this._selectResults);
    }),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnValue(insertResult),
    update: vi.fn().mockReturnValue(updateResult),
    ...overrides,
  };
  return db;
}

// ─── getOrFetchBootstrap ──────────────────────────────────────────────────────

describe('getOrFetchBootstrap', () => {
  beforeEach(() => {
    cache.clearCache();
    vi.clearAllMocks();
  });

  it('returns cached bootstrap without calling FPL API when fresh', async () => {
    const bootstrap = makeBootstrap([{ id: 5, is_current: true }]);
    const db = makeMockDb();
    db._selectResults = [{ isComplete: false, season: '2025-26', createdAt: new Date() }] as unknown[];
    let callCount = 0;
    db.limit = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve([{ isComplete: false, season: '2025-26', createdAt: new Date() }]);
      return Promise.resolve([{ season: '2025-26', data: bootstrap, fetchedAt: freshTimestamp(), archived: false }]);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getOrFetchBootstrap(db as any);

    expect(fplClient.getBootstrapStatic).not.toHaveBeenCalled();
    expect(result).toEqual(bootstrap);
  });

  it('fetches from FPL API when cache is stale and persists result', async () => {
    const bootstrap = makeBootstrap();
    vi.mocked(fplClient.getBootstrapStatic).mockResolvedValue(bootstrap);

    const db = makeMockDb();
    let callCount = 0;
    db.limit = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve([{ isComplete: false, season: '2025-26', createdAt: new Date() }]);
      return Promise.resolve([{ season: '2025-26', data: bootstrap, fetchedAt: staleTimestamp(), archived: false }]);
    });
    const insertValues = vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn(), onConflictDoUpdate: vi.fn() });
    db.insert = vi.fn().mockReturnThis();
    db.values = insertValues;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchBootstrap(db as any);

    expect(fplClient.getBootstrapStatic).toHaveBeenCalledOnce();
    expect(insertValues).toHaveBeenCalled();
  });

  it('archives old season rows and inserts new fpl_meta on season rollover', async () => {
    const newBootstrap = makeBootstrap([{ id: 1, deadline_time: '2026-08-15T11:00:00Z' }]);
    vi.mocked(fplClient.getBootstrapStatic).mockResolvedValue(newBootstrap);

    const db = makeMockDb();
    let callCount = 0;
    db.limit = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve([{ isComplete: false, season: '2025-26', createdAt: new Date() }]);
      return Promise.resolve([]);
    });
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
    db.update = vi.fn().mockReturnValue({ set: updateSet });
    const onConflictDoNothing = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoNothing, onConflictDoUpdate: vi.fn() });
    db.insert = vi.fn().mockReturnThis();
    db.values = values;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchBootstrap(db as any);

    expect(fplClient.getBootstrapStatic).toHaveBeenCalledOnce();
    expect(db.update).toHaveBeenCalled();
    expect(onConflictDoNothing).toHaveBeenCalled();
  });

  it('returns from L1 on second call without hitting DB', async () => {
    const bootstrap = makeBootstrap([{ id: 5, is_current: true }]);
    const db = makeMockDb();
    let dbCallCount = 0;
    db.limit = vi.fn().mockImplementation(() => {
      dbCallCount++;
      if (dbCallCount === 1)
        return Promise.resolve([{ isComplete: false, season: '2025-26', createdAt: new Date() }]);
      return Promise.resolve([
        { season: '2025-26', data: bootstrap, fetchedAt: freshTimestamp(), archived: false },
      ]);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchBootstrap(db as any);
    const callsAfterFirst = (db.limit as ReturnType<typeof vi.fn>).mock.calls.length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchBootstrap(db as any);

    expect((db.limit as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterFirst);
  });

  it('sets is_complete when GW38 is finished and data_checked', async () => {
    const bootstrap = makeBootstrap([{ id: 38, finished: true, data_checked: true }]);
    vi.mocked(fplClient.getBootstrapStatic).mockResolvedValue(bootstrap);

    const db = makeMockDb();
    let callCount = 0;
    db.limit = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve([{ isComplete: false, season: '2025-26', createdAt: new Date() }]);
      return Promise.resolve([]);
    });
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
    db.update = vi.fn().mockReturnValue({ set: updateSet });
    db.insert = vi.fn().mockReturnThis();
    db.values = vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn(), onConflictDoUpdate: vi.fn() });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchBootstrap(db as any);

    expect(updateSet).toHaveBeenCalledWith({ isComplete: true });
  });
});

// ─── getOrFetchGwLive ─────────────────────────────────────────────────────────

describe('getOrFetchGwLive', () => {
  const season = '2025-26';
  const liveData = { elements: [] };
  const events = [makeEvent({ id: 5, data_checked: true })];

  beforeEach(() => {
    cache.clearCache();
    vi.clearAllMocks();
  });

  it('returns frozen row without calling FPL API', async () => {
    const db = makeMockDb();
    db._selectResults = [{ season, gw: 5, data: liveData, frozen: true, fetchedAt: staleTimestamp() }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getOrFetchGwLive(db as any, season, 5, events);

    expect(fplClient.getLive).not.toHaveBeenCalled();
    expect(result).toEqual(liveData);
  });

  it('returns fresh non-frozen row without calling FPL API', async () => {
    const db = makeMockDb();
    db._selectResults = [{ season, gw: 5, data: liveData, frozen: false, fetchedAt: freshTimestamp() }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getOrFetchGwLive(db as any, season, 5, events);

    expect(fplClient.getLive).not.toHaveBeenCalled();
    expect(result).toEqual(liveData);
  });

  it('fetches from FPL API when stale and sets frozen=true when data_checked', async () => {
    vi.mocked(fplClient.getLive).mockResolvedValue(liveData as never);
    const db = makeMockDb();
    db._selectResults = [{ season, gw: 5, data: liveData, frozen: false, fetchedAt: staleTimestamp() }];
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    db.insert = vi.fn().mockReturnThis();
    db.values = vi.fn().mockReturnValue({ onConflictDoUpdate });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchGwLive(db as any, season, 5, events);

    expect(fplClient.getLive).toHaveBeenCalledWith(5);
    const valuesArg = db.values.mock.calls[0][0];
    expect(valuesArg.frozen).toBe(true);
  });

  it('serves frozen row from L1 on second call', async () => {
    const db = makeMockDb();
    db._selectResults = [{ season, gw: 5, data: liveData, frozen: true, fetchedAt: staleTimestamp() }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchGwLive(db as any, season, 5, events);
    const callsAfterFirst = (db.limit as ReturnType<typeof vi.fn>).mock.calls.length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchGwLive(db as any, season, 5, events);
    expect((db.limit as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterFirst);
  });

  it('serves fresh non-frozen row from L1 on second call', async () => {
    const db = makeMockDb();
    db._selectResults = [{ season, gw: 5, data: liveData, frozen: false, fetchedAt: freshTimestamp() }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchGwLive(db as any, season, 5, events);
    const callsAfterFirst = (db.limit as ReturnType<typeof vi.fn>).mock.calls.length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchGwLive(db as any, season, 5, events);
    expect((db.limit as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterFirst);
  });

  it('fetches from FPL API when row is missing', async () => {
    vi.mocked(fplClient.getLive).mockResolvedValue(liveData as never);
    const db = makeMockDb();
    db._selectResults = [];
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    db.insert = vi.fn().mockReturnThis();
    db.values = vi.fn().mockReturnValue({ onConflictDoUpdate });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchGwLive(db as any, season, 5, events);

    expect(fplClient.getLive).toHaveBeenCalledWith(5);
  });
});

// ─── getOrFetchSquad ─────────────────────────────────────────────────────────

describe('getOrFetchSquad', () => {
  const season = '2025-26';
  const picksData = { picks: [], active_chip: null, automatic_subs: [] };
  const events = [makeEvent({ id: 5, finished: true, data_checked: true })];

  beforeEach(() => {
    cache.clearCache();
    vi.clearAllMocks();
  });

  it('returns frozen squad from DB without FPL API call', async () => {
    const db = makeMockDb();
    db._selectResults = [{ season, teamId: 1, gw: 5, data: picksData, frozen: true, fetchedAt: staleTimestamp() }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getOrFetchSquad(db as any, season, 1, 5, events);

    expect(fplClient.getPicks).not.toHaveBeenCalled();
    expect(result).toEqual(picksData);
  });

  it('serves frozen squad from L1 on second call', async () => {
    const db = makeMockDb();
    db._selectResults = [{ season, teamId: 1, gw: 5, data: picksData, frozen: true, fetchedAt: staleTimestamp() }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchSquad(db as any, season, 1, 5, events);
    const callsAfterFirst = (db.limit as ReturnType<typeof vi.fn>).mock.calls.length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchSquad(db as any, season, 1, 5, events);
    expect((db.limit as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterFirst);
  });

  it('serves fresh non-frozen squad from L1 on second call', async () => {
    const db = makeMockDb();
    db._selectResults = [{ season, teamId: 1, gw: 5, data: picksData, frozen: false, fetchedAt: freshTimestamp() }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchSquad(db as any, season, 1, 5, events);
    const callsAfterFirst = (db.limit as ReturnType<typeof vi.fn>).mock.calls.length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchSquad(db as any, season, 1, 5, events);
    expect((db.limit as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterFirst);
  });

  it('fetches from FPL API when row is missing and sets frozen correctly', async () => {
    vi.mocked(fplClient.getPicks).mockResolvedValue(picksData as never);
    const db = makeMockDb();
    db._selectResults = [];
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    db.insert = vi.fn().mockReturnThis();
    db.values = vi.fn().mockReturnValue({ onConflictDoUpdate });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchSquad(db as any, season, 1, 5, events);

    expect(fplClient.getPicks).toHaveBeenCalledWith(1, 5);
    const valuesArg = db.values.mock.calls[0][0];
    expect(valuesArg.frozen).toBe(true);
  });
});

// ─── getOrFetchHistory ────────────────────────────────────────────────────────

describe('getOrFetchHistory', () => {
  const season = '2025-26';
  const historyData = { current: [], chips: [] };
  const events = [
    makeEvent({ id: 1, deadline_time: '2025-08-16T11:00:00Z', finished: true }),
    makeEvent({ id: 2, deadline_time: '2025-08-23T11:00:00Z', finished: true }),
    makeEvent({ id: 3, deadline_time: '2025-08-30T11:00:00Z', finished: false }),
  ];

  beforeEach(() => {
    cache.clearCache();
    vi.clearAllMocks();
  });

  it('returns cached row without fetch when season is complete', async () => {
    const db = makeMockDb();
    db._selectResults = [{ season, teamId: 1, data: historyData, lastFinishedGw: 2, fetchedAt: staleTimestamp() }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getOrFetchHistory(db as any, season, 1, events, true);

    expect(fplClient.getHistory).not.toHaveBeenCalled();
    expect(result).toEqual(historyData);
  });

  it('returns cached row without fetch when last_finished_gw is current', async () => {
    const db = makeMockDb();
    db._selectResults = [{ season, teamId: 1, data: historyData, lastFinishedGw: 2, fetchedAt: staleTimestamp() }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getOrFetchHistory(db as any, season, 1, events, false);

    expect(fplClient.getHistory).not.toHaveBeenCalled();
    expect(result).toEqual(historyData);
  });

  it('serves from L1 on second call when season is complete', async () => {
    const db = makeMockDb();
    db._selectResults = [{ season, teamId: 1, data: historyData, lastFinishedGw: 2, fetchedAt: staleTimestamp() }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchHistory(db as any, season, 1, events, true);
    const callsAfterFirst = (db.limit as ReturnType<typeof vi.fn>).mock.calls.length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchHistory(db as any, season, 1, events, true);
    expect((db.limit as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterFirst);
  });

  it('serves from L1 on second call when active and last_finished_gw is current', async () => {
    const db = makeMockDb();
    db._selectResults = [{ season, teamId: 1, data: historyData, lastFinishedGw: 2, fetchedAt: staleTimestamp() }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchHistory(db as any, season, 1, events, false);
    const callsAfterFirst = (db.limit as ReturnType<typeof vi.fn>).mock.calls.length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchHistory(db as any, season, 1, events, false);
    expect((db.limit as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterFirst);
  });

  it('fetches when cached last_finished_gw is behind bootstrap', async () => {
    vi.mocked(fplClient.getHistory).mockResolvedValue(historyData as never);
    const db = makeMockDb();
    db._selectResults = [{ season, teamId: 1, data: historyData, lastFinishedGw: 1, fetchedAt: freshTimestamp() }];
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    db.insert = vi.fn().mockReturnThis();
    db.values = vi.fn().mockReturnValue({ onConflictDoUpdate });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchHistory(db as any, season, 1, events, false);

    expect(fplClient.getHistory).toHaveBeenCalledWith(1);
    const valuesArg = db.values.mock.calls[0][0];
    expect(valuesArg.lastFinishedGw).toBe(2);
  });
});

// ─── getOrFetchTransfers ──────────────────────────────────────────────────────

describe('getOrFetchTransfers', () => {
  const season = '2025-26';
  const transfersData = [{ element_in: 1, element_out: 2, element_in_cost: 80, element_out_cost: 75, entry: 10, event: 3, time: '' }];
  const events = [
    makeEvent({ id: 1, deadline_time: '2025-08-16T11:00:00Z', finished: true }),
    makeEvent({ id: 2, deadline_time: '2025-08-23T11:00:00Z', finished: false }),
  ];

  beforeEach(() => {
    cache.clearCache();
    vi.clearAllMocks();
  });

  it('returns cached row without fetch when season is complete', async () => {
    const db = makeMockDb();
    db._selectResults = [{ season, teamId: 1, data: transfersData, lastFinishedGw: 1, fetchedAt: staleTimestamp() }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getOrFetchTransfers(db as any, season, 1, events, true);

    expect(fplClient.getTransfers).not.toHaveBeenCalled();
    expect(result).toEqual(transfersData);
  });

  it('fetches when row is missing', async () => {
    vi.mocked(fplClient.getTransfers).mockResolvedValue(transfersData as never);
    const db = makeMockDb();
    db._selectResults = [];
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    db.insert = vi.fn().mockReturnThis();
    db.values = vi.fn().mockReturnValue({ onConflictDoUpdate });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchTransfers(db as any, season, 1, events, false);

    expect(fplClient.getTransfers).toHaveBeenCalledWith(1);
  });

  it('serves from L1 on second call when season is complete', async () => {
    const db = makeMockDb();
    db._selectResults = [{ season, teamId: 1, data: transfersData, lastFinishedGw: 1, fetchedAt: staleTimestamp() }];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchTransfers(db as any, season, 1, events, true);
    const callsAfterFirst = (db.limit as ReturnType<typeof vi.fn>).mock.calls.length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getOrFetchTransfers(db as any, season, 1, events, true);
    expect((db.limit as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterFirst);
  });
});
