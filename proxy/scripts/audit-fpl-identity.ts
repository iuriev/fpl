import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { getBootstrapStatic } from '../src/fpl-client';
import { auditBootstrapSeasonIdentity } from '../src/fpl-identity/audit-bootstrap-season';
import { auditSeasonIdentity } from '../src/fpl-identity/audit-season';
import { auditSeasonPair, loadSeasonAudit } from '../src/fpl-identity/audit-season-pair';
import { defaultDataDir } from '../src/prediction/ingest';

const rawArgs = process.argv.slice(2);
const liveFlag = rawArgs.includes('--live');
const args = rawArgs.filter((a) => !a.startsWith('--'));
const dataDir = process.env.PRED_DATA_DIR ?? defaultDataDir();

function groupIssuesByCode(issues: { code: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const issue of issues) {
    counts.set(issue.code, (counts.get(issue.code) ?? 0) + 1);
  }
  return counts;
}

function serializeRegistry(result: Awaited<ReturnType<typeof auditSeasonIdentity>>) {
  return {
    ...result,
    playerRegistry: {
      byCode: Object.fromEntries(result.playerRegistry.byCode),
      elementToCode: Object.fromEntries(result.playerRegistry.elementToCode),
    },
    teamRegistry: {
      byCode: Object.fromEntries(result.teamRegistry.byCode),
      idToCode: Object.fromEntries(result.teamRegistry.idToCode),
      slugToCode: Object.fromEntries(result.teamRegistry.slugToCode),
    },
  };
}

async function printSeasonResult(
  result: Awaited<ReturnType<typeof auditSeasonIdentity>>,
): Promise<boolean> {
  console.log(`\nFPL identity audit — ${result.season} (${result.source})`);
  console.log('─'.repeat(48));
  console.log(`Status: ${result.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Errors: ${result.errorCount}  Warnings: ${result.warningCount}`);
  console.log(
    `Players: ${result.stats.playersRaw}  Teams: ${result.stats.teams}  ` +
      `merged_gw rows: ${result.stats.mergedGwRows}  unique elements: ${result.stats.mergedGwElements}`,
  );
  console.log(`Player registry: ${result.playerRegistry.byCode.size} codes`);

  const byCode = groupIssuesByCode(result.issues);
  if (byCode.size > 0) {
    console.log('\nIssues by code:');
    for (const [code, count] of [...byCode.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${code}: ${count}`);
    }
    console.log('\nFirst 10 issues:');
    for (const issue of result.issues.slice(0, 10)) {
      console.log(`  [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  const reportDir = join(dataDir, 'audit');
  await mkdir(reportDir, { recursive: true });
  const reportPath = join(reportDir, `${result.season}-identity-audit.json`);
  await writeFile(reportPath, JSON.stringify(serializeRegistry(result), null, 2));
  console.log(`Report: ${reportPath}`);

  return result.ok;
}

async function printCrossSeason(
  cross: Awaited<ReturnType<typeof auditSeasonPair>>['crossSeason'],
): Promise<boolean> {
  console.log(`\nCross-season audit — ${cross.seasonA} → ${cross.seasonB}`);
  console.log('─'.repeat(48));
  console.log(`Status: ${cross.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Errors: ${cross.errorCount}  Warnings: ${cross.warningCount}`);
  console.log(
    `Player codes: ${cross.stats.playerCodesA} (${cross.seasonA}) / ${cross.stats.playerCodesB} (${cross.seasonB})` +
      ` / ${cross.stats.playerCodesBoth} shared`,
  );
  console.log(
    `New in ${cross.seasonB}: ${cross.stats.newPlayerCodesInB}  ` +
      `Departed: ${cross.stats.departedPlayerCodes}`,
  );
  console.log(`Team codes shared: ${cross.stats.teamCodesBoth}`);

  if (cross.issues.length > 0) {
    console.log('\nIssues:');
    for (const issue of cross.issues.slice(0, 15)) {
      console.log(`  [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  const reportPath = join(dataDir, 'audit', `${cross.seasonA}_${cross.seasonB}-cross-season-audit.json`);
  await writeFile(reportPath, JSON.stringify(cross, null, 2));
  console.log(`Report: ${reportPath}`);

  return cross.ok;
}

async function main(): Promise<void> {
  if (args.length === 0) {
    args.push('2023-24');
  }

  let ok = true;

  if (args.length >= 2) {
    const [seasonA, seasonB] = args;
    const pair = await auditSeasonPair(seasonA, seasonB, dataDir, {
      seasonBSource: liveFlag ? 'bootstrap' : 'vaastav',
    });
    ok =
      (await printSeasonResult(pair.seasonA)) &&
      (await printSeasonResult(pair.seasonB)) &&
      (await printCrossSeason(pair.crossSeason)) &&
      ok;
  } else if (liveFlag) {
    const season = args[0];
    const bootstrap = await getBootstrapStatic();
    const result = await auditBootstrapSeasonIdentity(bootstrap, season, dataDir);
    ok = (await printSeasonResult(result)) && ok;
  } else {
    const result = await loadSeasonAudit(args[0], dataDir, 'vaastav');
    ok = (await printSeasonResult(result)) && ok;
  }

  if (!ok) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
