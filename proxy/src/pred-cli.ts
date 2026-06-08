import { closeDb, db, runMigrations } from './db/client';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
import { deriveSeason } from './fpl-cache/season';
import { defaultDataDir, ingestPlayerGwFacts, loadMergedGwFromDisk } from './prediction/ingest';
import { runPredictionIngest } from './prediction/run-ingest';
import { runScoreGameweek } from './prediction/score';
import { resolveNextGw } from './resolve-next-gw';

const cmd = process.argv[2];

async function ingest() {
  await runMigrations();
  const dataDir = defaultDataDir();
  console.log(`[pred:ingest] data dir: ${dataDir}`);

  const onlyFlag = process.argv.find((a) => a.startsWith('--season='));
  if (onlyFlag) {
    const season = onlyFlag.split('=')[1]!;
    const facts = await loadMergedGwFromDisk(season, dataDir);
    const n = await ingestPlayerGwFacts(db, facts);
    console.log(`[pred:ingest] ${season} player-gw facts: ${n}`);
    return;
  }

  await runPredictionIngest(db, dataDir);
}

async function score() {
  await runMigrations();
  const eventFlag = process.argv.find((a) => a.startsWith('--event='));
  const seasonFlag = process.argv.find((a) => a.startsWith('--season='));
  let event = eventFlag ? parseInt(eventFlag.split('=')[1], 10) : NaN;
  let season = seasonFlag?.split('=')[1];

  if (isNaN(event) || !season) {
    const bootstrap = await getOrFetchBootstrap(db);
    if (isNaN(event)) {
      event = resolveNextGw(bootstrap);
      console.log(`[pred:score] default event=${event} (next gameweek from bootstrap)`);
    }
    if (!season) {
      season = deriveSeason(bootstrap.events);
      console.log(`[pred:score] default season=${season} (from bootstrap)`);
    }
  }

  const runId = await runScoreGameweek(db, season, event, defaultDataDir());
  console.log(`[pred:score] model_run_id=${runId} event=${event} season=${season}`);
}

try {
  if (cmd === 'ingest') {
    await ingest();
  } else if (cmd === 'score') {
    await score();
  } else {
    console.error(
      'Usage: pred-cli ingest [--season=2025-26] | pred-cli score [--event=N] [--season=2024-25]',
    );
    process.exitCode = 1;
  }
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await closeDb();
}
