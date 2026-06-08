import { db } from './db/client';
import { runMigrations } from './db/client';
import { lineupsWarmupFlagLog } from './flagged-log';
import { runLineupsWarmup } from './lineups-warmup';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

await runMigrations();
await runLineupsWarmup(db);
lineupsWarmupFlagLog.log('finished');
