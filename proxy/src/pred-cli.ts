import { runMigrations } from './db/client';
import { db } from './db/client';
import {
  defaultDataDir,
  ingestEplMatches,
  ingestPlayerGwFacts,
  ingestTeamAlias,
  loadEplMatchesFromDisk,
  loadMergedGwFromDisk,
} from './prediction/ingest';
import { runScoreGameweek } from './prediction/score';

const cmd = process.argv[2];

async function ingest() {
  await runMigrations();
  const dataDir = defaultDataDir();
  console.log(`[pred:ingest] data dir: ${dataDir}`);

  const onlyFlag = process.argv.find((a) => a.startsWith('--season='));
  if (!onlyFlag) {
    const aliasCount = await ingestTeamAlias(db, dataDir);
    console.log(`[pred:ingest] team aliases: ${aliasCount}`);
    const matches = await loadEplMatchesFromDisk(dataDir);
    const matchCount = await ingestEplMatches(db, matches);
    console.log(`[pred:ingest] epl matches: ${matchCount}`);
  }
  const seasons = onlyFlag
    ? [onlyFlag.split('=')[1]]
    : ['2022-23', '2023-24', '2024-25', '2025-26'];
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

async function score() {
  await runMigrations();
  const eventFlag = process.argv.find((a) => a.startsWith('--event='));
  const seasonFlag = process.argv.find((a) => a.startsWith('--season='));
  const event = eventFlag ? parseInt(eventFlag.split('=')[1], 10) : NaN;
  const season = seasonFlag?.split('=')[1] ?? '2024-25';
  if (isNaN(event)) {
    console.error('Usage: pred-cli score --event=34 [--season=2024-25]');
    process.exit(1);
  }
  const runId = await runScoreGameweek(db, season, event, defaultDataDir());
  console.log(`[pred:score] model_run_id=${runId} event=${event} season=${season}`);
}

if (cmd === 'ingest') {
  await ingest();
} else if (cmd === 'score') {
  await score();
} else {
  console.error(
    'Usage: pred-cli ingest [--season=2025-26] | pred-cli score --event=N [--season=2024-25]',
  );
  process.exit(1);
}
