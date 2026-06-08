import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import * as schema from '../db/schema';
import {
  defaultDataDir,
  ingestEplMatches,
  ingestPlayerGwFacts,
  ingestTeamAlias,
  loadEplMatchesFromDisk,
  loadMergedGwFromDisk,
} from './ingest';

const DEFAULT_SEASONS = ['2022-23', '2023-24', '2024-25', '2025-26'];

export async function runPredictionIngest(
  db: PostgresJsDatabase<typeof schema>,
  dataDir = defaultDataDir(),
  seasons: string[] = DEFAULT_SEASONS,
): Promise<void> {
  const aliasCount = await ingestTeamAlias(db, dataDir);
  console.log(`[pred:ingest] team aliases: ${aliasCount}`);

  const matches = await loadEplMatchesFromDisk(dataDir);
  const matchCount = await ingestEplMatches(db, matches);
  console.log(`[pred:ingest] epl matches: ${matchCount}`);

  for (const season of seasons) {
    try {
      const facts = await loadMergedGwFromDisk(season, dataDir);
      const n = await ingestPlayerGwFacts(db, facts);
      console.log(`[pred:ingest] ${season} player-gw facts: ${n}`);
    } catch (err) {
      console.warn(`[pred:ingest] skip ${season}:`, err);
    }
  }
}
