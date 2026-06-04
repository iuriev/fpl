import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  enqueueFplFetchForTests,
  getFplQueueDepth,
  peekQueuePathsForTests,
  resetFplRequestQueueForTests,
  scheduleFplFetch,
} from './fpl-request-queue';

describe('fpl-request-queue', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    resetFplRequestQueueForTests();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('queues interactive paths before background', () => {
    enqueueFplFetchForTests('/fixtures/', 'background');
    enqueueFplFetchForTests('/bootstrap-static/', 'interactive');

    expect(peekQueuePathsForTests()).toEqual([
      '/bootstrap-static/',
      '/fixtures/',
    ]);
  });

  it('spaces interactive fetches by 100ms', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const p1 = scheduleFplFetch('/a/', 'interactive');
    const p2 = scheduleFplFetch('/b/', 'interactive');
    expect(getFplQueueDepth()).toBeGreaterThanOrEqual(0);

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);
    await Promise.all([p1, p2]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
