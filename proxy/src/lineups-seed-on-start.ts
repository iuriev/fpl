import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), '../scripts');

export function isLineupsSeedOnStartEnabled(): boolean {
  return process.env.LINEUPS_SEED_ON_START === 'true';
}

function runNodeScript(scriptName: string): Promise<void> {
  const scriptPath = join(scriptsDir, scriptName);
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `[lineups:seed] ${scriptName} exited with code ${code ?? 'null'} signal ${signal ?? 'null'}`
          )
        );
    });
  });
}

export async function maybeRunLineupsSeedOnStart(): Promise<void> {
  if (!isLineupsSeedOnStartEnabled()) return;

  console.log(
    '[lineups:seed] LINEUPS_SEED_ON_START=true — fetching FPL bootstrap and rewriting position JSON'
  );
  const started = Date.now();
  await runNodeScript('seed-player-tactical-roles.mjs');
  await runNodeScript('seed-player-lanes.mjs');
  console.log(`[lineups:seed] position registry refreshed in ${Date.now() - started}ms`);
}
