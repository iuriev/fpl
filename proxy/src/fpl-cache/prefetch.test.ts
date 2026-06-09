import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as fplClient from '../fpl-client';
import { prefetchMissingGwData } from './prefetch';

vi.mock('../fpl-client');

const mockLive = { elements: [] };
const mockDreamTeam = { team: [], top_player: { id: 1, points: 10 } };

function makeBootstrapEvents(count: number, allFrozen = true) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    finished: allFrozen,
    data_checked: allFrozen,
    name: `Gameweek ${i + 1}`,
    deadline_time: '2025-08-09T11:00:00Z',
    is_current: false,
    is_next: false,
    average_entry_score: 50,
    highest_score: 100,
  }));
}

describe('prefetchMissingGwData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(fplClient.getLive).mockResolvedValue(mockLive as never);
    vi.mocked(fplClient.getDreamTeam).mockResolvedValue(mockDreamTeam as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing when no finished+data_checked events exist', async () => {
    const events = makeBootstrapEvents(3, false);
    const db = buildMockDb([], []);

    await prefetchMissingGwData(db, '2025-26', events);

    expect(fplClient.getLive).not.toHaveBeenCalled();
    expect(fplClient.getDreamTeam).not.toHaveBeenCalled();
  });

  it('stops after 10 total fetches regardless of missing GW count', async () => {
    const events = makeBootstrapEvents(20);
    const db = buildMockDb([], []);

    const fetchPromise = prefetchMissingGwData(db, '2025-26', events);
    await vi.runAllTimersAsync();
    await fetchPromise;

    const totalFetches =
      vi.mocked(fplClient.getLive).mock.calls.length +
      vi.mocked(fplClient.getDreamTeam).mock.calls.length;
    expect(totalFetches).toBeLessThanOrEqual(10);
  });

  it('skips GWs that already have frozen live rows', async () => {
    const events = makeBootstrapEvents(3);
    const db = buildMockDb([1, 2, 3], []);

    const fetchPromise = prefetchMissingGwData(db, '2025-26', events);
    await vi.runAllTimersAsync();
    await fetchPromise;

    expect(fplClient.getLive).not.toHaveBeenCalled();
  });

  it('skips GWs that already have frozen dream team rows', async () => {
    const events = makeBootstrapEvents(3);
    const db = buildMockDb([], [1, 2, 3]);

    const fetchPromise = prefetchMissingGwData(db, '2025-26', events);
    await vi.runAllTimersAsync();
    await fetchPromise;

    expect(fplClient.getDreamTeam).not.toHaveBeenCalled();
  });

  it('continues after individual fetch errors', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const events = makeBootstrapEvents(2);
    vi.mocked(fplClient.getLive).mockRejectedValueOnce(new Error('FPL API error'));
    vi.mocked(fplClient.getLive).mockResolvedValue(mockLive as never);

    const db = buildMockDb([], [1, 2]);

    const fetchPromise = prefetchMissingGwData(db, '2025-26', events);
    await vi.runAllTimersAsync();
    await fetchPromise;

    expect(fplClient.getLive).toHaveBeenCalledTimes(2);
    errorSpy.mockRestore();
  });
});

function buildMockDb(frozenLiveGws: number[], frozenDreamTeamGws: number[]) {
  let callCount = 0;
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation(function (this: unknown) {
      callCount++;
      const result =
        callCount === 1
          ? frozenLiveGws.map((gw) => ({ gw }))
          : frozenDreamTeamGws.map((gw) => ({ gw }));
      return Promise.resolve(result);
    }),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
  };
  return mockDb as unknown as Parameters<typeof prefetchMissingGwData>[0];
}
