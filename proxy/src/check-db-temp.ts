import { sql } from 'drizzle-orm';

import { db } from './db/client';

async function main() {
  const rows = await db.execute(sql`
    SELECT season_element_id, x_pts, x_goals, x_assists, cs_prob
    FROM pred_player_gw
    WHERE model_run_id = (SELECT id FROM pred_model_run ORDER BY created_at DESC LIMIT 1)
    ORDER BY x_pts DESC NULLS LAST
    LIMIT 10
  `);
  for (const r of rows) console.log(JSON.stringify(r));
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
