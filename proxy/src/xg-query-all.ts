import { getOrFetchBootstrap } from './fpl-cache/db-cache';
import { db } from './db/client';
import { desc, eq } from 'drizzle-orm';
import { predModelRun, predPlayerGw } from './db/schema';

const [run] = await db.select().from(predModelRun)
  .where(eq(predModelRun.kind, 'score'))
  .orderBy(desc(predModelRun.createdAt))
  .limit(1);

const rows = await db.select().from(predPlayerGw)
  .where(eq(predPlayerGw.modelRunId, run.id));

const bootstrap = await getOrFetchBootstrap(db);
const codeToEl = new Map(bootstrap.elements.map(e => [e.code, e]));

const POS: Record<number, string> = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };

for (const posType of [3, 2]) {
  const label = POS[posType];
  const top = rows
    .map(r => {
      const el = codeToEl.get(r.fplCode);
      if (!el || el.element_type !== posType) return null;
      return { name: el.web_name, xG: r.xGoals, xA: r.xAssists, xPts: r.xPts, conf: r.confidence };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.xG - a.xG)
    .slice(0, 15);

  console.log(`\nТоп-15 ${label} по xG:`);
  console.log('─'.repeat(64));
  console.log('Имя'.padEnd(22) + 'xG'.padStart(7) + 'xA'.padStart(7) + 'xPts'.padStart(7) + '  conf');
  console.log('─'.repeat(64));
  for (const r of top) {
    console.log(r.name.padEnd(22) + r.xG.toFixed(3).padStart(7) + r.xA.toFixed(3).padStart(7) + r.xPts.toFixed(2).padStart(7) + '  ' + r.conf);
  }
}
