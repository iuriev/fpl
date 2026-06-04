import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

  console.log(
    '[lineups:seed] LINEUPS_SEED_ON_START=true — Transfermarkt ingest (slow; ~4s per club)'
  );
  const started = Date.now();
  await runTransfermarktIngest();
  console.log(`[lineups:seed] position registry refreshed in ${Date.now() - started}ms`);
}
