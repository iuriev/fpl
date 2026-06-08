import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const execute = vi.fn();
const getOrFetchBootstrap = vi.fn();

vi.mock('./db/client', () => ({
  db: { execute },
}));

vi.mock('./fpl-cache/db-cache', () => ({
  getOrFetchBootstrap,
}));

vi.mock('./fpl-identity/live-mapper-cache', () => ({
  elementIdToFplCode: vi.fn(),
  fplCodeToElementId: vi.fn(),
}));

describe('ensurePlayerWatchlistSchema', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    execute
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValueOnce([{ exists: false }])
      .mockResolvedValueOnce([])
      .mockResolvedValue([]);
    getOrFetchBootstrap.mockResolvedValue({ elements: [], teams: [] });
  });

  it('adds fpl_code column before backfill when legacy player_id exists', async () => {
    const { ensurePlayerWatchlistSchema } = await import('./player-watchlist-service');
    await ensurePlayerWatchlistSchema();

    expect(execute).toHaveBeenCalledWith(
      sql`ALTER TABLE player_watchlist_entry ADD COLUMN IF NOT EXISTS fpl_code integer`,
    );
  });
});
