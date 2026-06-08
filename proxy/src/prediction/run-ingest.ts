import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import * as schema from '../db/schema';
import { flaggedLog, flaggedWarn, type StartupFlagTag } from '../flagged-log';
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
  flagTags?: StartupFlagTag[],
): Promise<void> {
  const log = (message: string) => {
    if (flagTags?.length) flaggedLog(flagTags, message);
    else console.log(`[pred:ingest] ${message}`);
  };
  const warn = (message: string, err: unknown) => {
    if (flagTags?.length) flaggedWarn(flagTags, message, err);
    else console.warn(`[pred:ingest] ${message}`, err);
  };

  const aliasCount = await ingestTeamAlias(db, dataDir);
  log(`team aliases: ${aliasCount}`);

  const matches = await loadEplMatchesFromDisk(dataDir);
  const matchCount = await ingestEplMatches(db, matches);
  log(`epl matches: ${matchCount}`);

  for (const season of seasons) {
    try {
      const facts = await loadMergedGwFromDisk(season, dataDir);
      const n = await ingestPlayerGwFacts(db, facts);
      log(`${season} player-gw facts: ${n}`);
    } catch (err) {
      warn(`skip ${season}:`, err);
    }
  }
}
