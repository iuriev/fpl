import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { seedFlagLog } from './flagged-log';

const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), '../scripts');

export function isLineupsSeedOnStartEnabled(): boolean {
  return process.env.LINEUPS_SEED_ON_START === 'true';
}

function runTransfermarktIngest(): Promise<void> {
  const scriptPath = join(scriptsDir, 'ingest-transfermarkt-positions.ts');
  const proxyRoot = join(scriptsDir, '..');
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsx', scriptPath], {
      cwd: proxyRoot,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `[lineups:seed] ingest-transfermarkt-positions exited with code ${code ?? 'null'} signal ${signal ?? 'null'}`
          )
        );
    });
  });
}

export async function maybeRunLineupsSeedOnStart(): Promise<void> {
  if (!isLineupsSeedOnStartEnabled()) return;

  seedFlagLog.log(
    'LINEUPS_SEED_ON_START=true — Transfermarkt ingest (slow; ~4s per club)',
  );
  const started = Date.now();
  await runTransfermarktIngest();
  seedFlagLog.log(`position registry refreshed in ${Date.now() - started}ms`);
}
