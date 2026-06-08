import { eq, sql } from 'drizzle-orm';

import { db } from './db/client';
import { playerWatchlistEntry } from './db/schema';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
import type { FPLBootstrapStatic } from './fpl-client';
import { elementIdToFplCode, fplCodeToElementId } from './fpl-identity/live-mapper-cache';

export const PLAYER_WATCHLIST_FREE_LIMIT = 2;

let legacyColumnDropped = false;

type LegacyWatchlistRow = {
  id: string;
  player_id: number;
  fpl_code: number | null;
};

export async function ensurePlayerWatchlistSchema(): Promise<void> {
  if (legacyColumnDropped) return;

  const hasPlayerId = await columnExists('player_watchlist_entry', 'player_id');
  if (!hasPlayerId) {
    legacyColumnDropped = true;
    return;
  }

  if (!(await columnExists('player_watchlist_entry', 'fpl_code'))) {
    await db.execute(sql`ALTER TABLE player_watchlist_entry ADD COLUMN IF NOT EXISTS fpl_code integer`);
  }

  const bootstrap = await getOrFetchBootstrap(db);
  const rows = await db.execute<LegacyWatchlistRow>(sql`
    SELECT id, player_id, fpl_code
    FROM player_watchlist_entry
    WHERE fpl_code IS NULL
  `);

  for (const row of rows) {
    const code = elementIdToFplCode(bootstrap, row.player_id);
    if (code === undefined) {
      await db.delete(playerWatchlistEntry).where(eq(playerWatchlistEntry.id, row.id));
      continue;
    }
    await db
      .update(playerWatchlistEntry)
      .set({ fplCode: code })
      .where(eq(playerWatchlistEntry.id, row.id));
  }

  await db.execute(sql`DELETE FROM player_watchlist_entry WHERE fpl_code IS NULL`);
  await db.execute(sql`ALTER TABLE player_watchlist_entry DROP COLUMN IF EXISTS player_id`);
  await db.execute(sql`DROP INDEX IF EXISTS player_watchlist_entry_user_player_idx`);
  await db.execute(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS player_watchlist_entry_user_fpl_code_idx ON player_watchlist_entry (user_id, fpl_code)`,
  );
  await db.execute(sql`ALTER TABLE player_watchlist_entry ALTER COLUMN fpl_code SET NOT NULL`);

  legacyColumnDropped = true;
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const result = await db.execute<{ exists: boolean }>(sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ${column}
    ) AS exists
  `);
  return Boolean(result[0]?.exists);
}

export async function loadWatchlistedFplCodes(userId: string): Promise<Set<number>> {
  const rows = await db
    .select({ fplCode: playerWatchlistEntry.fplCode })
    .from(playerWatchlistEntry)
    .where(eq(playerWatchlistEntry.userId, userId));
  return new Set(rows.map((r) => r.fplCode));
}

export async function resolveFplCodeFromBody(
  body: { fplCode?: unknown; playerId?: unknown },
  bootstrap: FPLBootstrapStatic,
): Promise<number | null> {
  const fplCode = Number(body.fplCode);
  if (Number.isInteger(fplCode) && fplCode > 0 && fplCodeToElementId(bootstrap, fplCode) !== undefined) {
    return fplCode;
  }

  const playerId = Number(body.playerId);
  if (Number.isInteger(playerId) && playerId > 0) {
    const fromElement = elementIdToFplCode(bootstrap, playerId);
    if (fromElement !== undefined) return fromElement;
  }

  return null;
}

export function resolveCurrentPlayerIds(
  fplCodes: Iterable<number>,
  bootstrap: FPLBootstrapStatic,
): number[] {
  const ids: number[] = [];
  for (const code of fplCodes) {
    const id = fplCodeToElementId(bootstrap, code);
    if (id !== undefined) ids.push(id);
  }
  return ids;
}
