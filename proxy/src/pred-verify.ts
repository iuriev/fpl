import { count, desc, eq } from 'drizzle-orm';

import { db } from './db/client';
import {
  predEplMatch,
  predModelRun,
  predPlayerGw,
  predPlayerGwFact,
  predTeamAlias,
} from './db/schema';

async function main() {
  const [m, f, a, runs] = await Promise.all([
    db.select({ n: count() }).from(predEplMatch),
    db.select({ n: count() }).from(predPlayerGwFact),
    db.select({ n: count() }).from(predTeamAlias),
    db.select().from(predModelRun).orderBy(desc(predModelRun.createdAt)).limit(5),
  ]);
  const matchN = Number(m[0]?.n ?? 0);
  const factN = Number(f[0]?.n ?? 0);
  const aliasN = Number(a[0]?.n ?? 0);
  console.log('[pred:verify] pred_epl_match', matchN, '(expect ~2280 for 6 FD seasons)');
  console.log('[pred:verify] pred_player_gw_fact', factN, '(expect ~106k for 4 vaastav seasons)');
  console.log('[pred:verify] pred_team_alias', aliasN, '(expect ~20)');
  if (matchN < 2000) console.warn('[pred:verify] low EPL match count — run pred:ingest');
  if (factN < 100_000) console.warn('[pred:verify] incomplete player-gw facts — pred:ingest may still be running');
  for (const run of runs) {
    const [p] = await db
      .select({ n: count() })
      .from(predPlayerGw)
      .where(eq(predPlayerGw.modelRunId, run.id));
    console.log(
      `[pred:verify] run ${run.id.slice(0, 8)}… kind=${run.kind} event=${run.targetEvent} players=${p?.n ?? 0}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
