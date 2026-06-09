import { closeDb, db, runMigrations } from '../src/db/client';
import { getOrFetchBootstrap, getOrFetchSquad } from '../src/fpl-cache/db-cache';
import { deriveSeason } from '../src/fpl-cache/season';
import {
  findXiBenchXPtsIssues,
  optimizeFreeHit,
  type OptimizerPlayer,
  resolveFreeHitBudget,
} from '../src/free-hit-optimizer';
import * as predictionService from '../src/prediction-service';
import { resolveNextGw } from '../src/resolve-next-gw';

const TEAM_ID = 72828;
const ELEMENT_TYPE_TO_POS: Record<number, OptimizerPlayer['position']> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

function nameById(
  bootstrap: Awaited<ReturnType<typeof getOrFetchBootstrap>>,
  id: number,
): string {
  return bootstrap.elements.find((el) => el.id === id)?.web_name ?? `id:${id}`;
}

async function main(): Promise<void> {
  await runMigrations();
  const bootstrap = await getOrFetchBootstrap(db);
  const targetGw = resolveNextGw(bootstrap);
  const season = deriveSeason(bootstrap.events);
  const currentGw =
    bootstrap.events.find((e) => e.is_current)?.id ??
    bootstrap.events.filter((e) => e.finished).at(-1)?.id ??
    1;

  const picks = await getOrFetchSquad(db, season, TEAM_ID, currentGw, bootstrap.events);
  const playerNowCostById = new Map(bootstrap.elements.map((el) => [el.id, el.now_cost] as const));
  const totalBudget = resolveFreeHitBudget(picks, playerNowCostById);

  const predictions = await predictionService.getPredictionsForEvent(targetGw);
  if (!predictions.ready) {
    console.error('Predictions not ready for GW', targetGw);
    process.exit(1);
  }

  const xPtsMap = new Map(predictions.players.map((p) => [p.fplCode, p.xPts]));
  const confidenceMap = new Map(predictions.players.map((p) => [p.fplCode, p.confidence] as const));

  const players = bootstrap.elements
    .filter((el) => el.status !== 'u')
    .map((el) => ({
      id: el.id,
      position: ELEMENT_TYPE_TO_POS[el.element_type] ?? ('GK' as const),
      teamId: el.team,
      nowCost: el.now_cost,
      xPts: xPtsMap.get(el.code) ?? 0,
      playConfidence: confidenceMap.get(el.code),
    }));

  const result = optimizeFreeHit(totalBudget, players, targetGw);
  const byId = new Map(players.map((p) => [p.id, p]));
  const label = (id: number) => nameById(bootstrap, id);

  console.log('GW', targetGw, 'budget', totalBudget, 'remaining', result.remainingBudget);
  console.log('XI total xPts', result.totalXPts.toFixed(1));
  console.log('\n--- STARTERS ---');
  for (const id of result.orderedSquad.slice(0, 11)) {
    const p = byId.get(id)!;
    console.log(`  ${label(id).padEnd(14)} ${p.position} ${p.xPts.toFixed(1)} £${(p.nowCost / 10).toFixed(1)}m`);
  }
  console.log('\n--- BENCH ---');
  for (const id of result.orderedSquad.slice(11)) {
    const p = byId.get(id)!;
    console.log(`  ${label(id).padEnd(14)} ${p.position} ${p.xPts.toFixed(1)} £${(p.nowCost / 10).toFixed(1)}m`);
  }

  const checkNames = ['B.Fernandes', 'Virgil', 'Truffert', 'Guéhi', 'Osula', 'Anderson'];
  console.log('\n--- xPts for key players ---');
  for (const el of bootstrap.elements.filter((e) => checkNames.includes(e.web_name))) {
    const opt = byId.get(el.id);
    if (!opt) continue;
    console.log(
      `  ${el.web_name.padEnd(14)} opt=${opt.xPts.toFixed(2)} ep_next=${el.ep_next} form=${el.form}`,
    );
  }

  const issues = findXiBenchXPtsIssues(result.orderedSquad, byId);
  if (issues.length === 0) {
    console.log('\n✓ No XI/bench xPts violations');
  } else {
    console.log('\n✗ ISSUES:');
    for (const issue of issues) console.log(' ', issue);
  }

  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
