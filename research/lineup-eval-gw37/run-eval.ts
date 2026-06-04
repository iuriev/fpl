import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { closeDb, db } from '../../proxy/src/db/client.ts';
import { getOrFetchBootstrap } from '../../proxy/src/fpl-cache/db-cache.ts';
import { deriveSeason } from '../../proxy/src/fpl-cache/season.ts';
import type { FPLBootstrapStatic, FPLElementSummary, FPLFixture } from '../../proxy/src/fpl-client.ts';
import { getCachedElementSummary } from '../../proxy/src/fpl-element-summary-cache.ts';
import { getOrFetchAllFixtures } from '../../proxy/src/fpl-fixtures-cache.ts';
import {
  countsFromStarters,
  formationLabel,
  type FormationCounts,
} from '../../proxy/src/formation-inference.ts';
import { predictedLineupPoolElements } from '../../proxy/src/predicted-lineup-pool.ts';
import { buildTeamLineup } from '../../proxy/src/predicted-lineup-service.ts';
import { loadPreviousSeasonFormationsByTeam } from '../../proxy/src/previous-season-formation.ts';
import {
  assignPlayersToSlots,
  type LaneAssignablePlayer,
} from '../../proxy/src/player-lane-registry.ts';
import { getPlayerTacticalRole } from '../../proxy/src/player-tactical-role.ts';

import { gameweekRangeLabel, parseTargetGameweeks } from './parse-gameweeks.ts';
import type { StarterMetrics } from './run-eval-types.ts';
import { writeFactualReport, type CombinedSummary } from './write-report.ts';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'output');

type LineGroup = 'DEF' | 'MID' | 'FWD';
type Verdict = 'correct_starter' | 'missed_starter' | 'false_starter' | 'bench_both';

function truncateSummary(summary: FPLElementSummary, beforeRound: number): FPLElementSummary {
  return { ...summary, history: summary.history.filter((h) => h.round < beforeRound) };
}

function fixturesBeforeGw(all: FPLFixture[], gw: number): FPLFixture[] {
  return all.map((f) => (f.event >= gw ? { ...f, finished: false } : f));
}

async function loadAllSummaries(
  bootstrap: FPLBootstrapStatic,
  season: string,
  targetGws: number[]
): Promise<Map<number, FPLElementSummary>> {
  const ids = [
    ...new Set(
      bootstrap.teams.flatMap((t) =>
        targetGws.flatMap((gw) =>
          predictedLineupPoolElements(bootstrap, t.id, gw).map((el) => el.id)
        )
      )
    ),
  ];
  const map = new Map<number, FPLElementSummary>();
  for (const id of ids) {
    const row = await getCachedElementSummary(db, season, id);
    if (row) map.set(id, row);
  }
  return map;
}

function summariesForGw(
  full: Map<number, FPLElementSummary>,
  gw: number
): Map<number, FPLElementSummary> {
  const out = new Map<number, FPLElementSummary>();
  for (const [id, s] of full) out.set(id, truncateSummary(s, gw));
  return out;
}

function actualStartersForFixture(
  teamId: number,
  fixtureId: number,
  bootstrap: FPLBootstrapStatic,
  summaries: Map<number, FPLElementSummary>
): FPLBootstrapStatic['elements'] {
  const starters: FPLBootstrapStatic['elements'] = [];
  for (const el of bootstrap.elements) {
    if (el.team !== teamId) continue;
    const row = summaries.get(el.id)?.history.find((h) => h.fixture === fixtureId);
    if (!row) continue;
    const started = row.starts > 0 || (row.starts === 0 && row.minutes >= 60);
    if (started) starters.push(el);
  }
  return starters;
}

function assignActualSlots(
  starters: FPLBootstrapStatic['elements'],
  line: LineGroup
): Map<number, { lane: string; role: string }> {
  const typeMap: Record<LineGroup, number> = { DEF: 2, MID: 3, FWD: 4 };
  const picks = starters.filter((el) => el.element_type === typeMap[line]);
  const assignable: LaneAssignablePlayer[] = picks.map((el) => ({
    id: el.id,
    code: el.code,
    startScore: 1,
  }));
  const assigned = assignPlayersToSlots(assignable, line, picks.length);
  return new Map(
    assigned.map((a) => [a.id, { lane: a.lane, role: getPlayerTacticalRole(a.code) }])
  );
}

interface PlayerRow {
  gameweek: number;
  teamShort: string;
  webName: string;
  elementId: number;
  fplCode: number;
  fplLine: string;
  predictedStarter: boolean;
  actualStarter: boolean;
  predictedRole: string | null;
  predictedLane: string | null;
  actualRole: string | null;
  actualLane: string | null;
  verdict: Verdict;
}

interface TeamGwSummary {
  gameweek: number;
  teamShort: string;
  fixtureId: number;
  opponent: string;
  predictedFormation: string;
  actualFormation: string | null;
  formationMatch: boolean;
  xiHits: number;
  xiMisses: number;
  xiFalsePositives: number;
  roleHits: number;
  roleCompared: number;
}

function computeMetrics(hits: number, misses: number, fp: number): StarterMetrics {
  return {
    correct: hits,
    missed: misses,
    falsePositives: fp,
    precision: hits / (hits + fp || 1),
    recall: hits / (hits + misses || 1),
    xiAccuracyPerPlayer: hits / (hits + misses + fp || 1),
  };
}

function fplLineLabel(elementType: number): string {
  if (elementType === 1) return 'GK';
  if (elementType === 2) return 'DEF';
  if (elementType === 3) return 'MID';
  if (elementType === 4) return 'FWD';
  return '?';
}

async function evaluateGameweek(
  targetGw: number,
  bootstrap: FPLBootstrapStatic,
  allFixturesRaw: FPLFixture[],
  summariesFull: Map<number, FPLElementSummary>,
  previousSeason: Map<number, FormationCounts | null>
): Promise<{ playerRows: PlayerRow[]; teamSummaries: TeamGwSummary[] }> {
  const summariesTruncated = summariesForGw(summariesFull, targetGw);
  const allFixtures = fixturesBeforeGw(allFixturesRaw, targetGw);
  const teamById = new Map(bootstrap.teams.map((t) => [t.id, t]));
  const gwFixtures = allFixturesRaw.filter((f) => f.event === targetGw);

  const predictedTeams = bootstrap.teams.map((team) =>
    buildTeamLineup(
      team.id,
      bootstrap,
      summariesTruncated,
      allFixtures,
      {},
      targetGw,
      previousSeason.get(team.id) ?? null
    )
  );

  const playerRows: PlayerRow[] = [];
  const teamSummaries: TeamGwSummary[] = [];

  for (const pred of predictedTeams) {
    const fixture = gwFixtures.find(
      (f) => f.team_h === pred.teamId || f.team_a === pred.teamId
    );
    if (!fixture) continue;

    const oppId = fixture.team_h === pred.teamId ? fixture.team_a : fixture.team_h;
    const opp = teamById.get(oppId)?.short_name ?? '?';

    const actualEls = actualStartersForFixture(
      pred.teamId,
      fixture.id,
      bootstrap,
      summariesFull
    );
    const actualCounts = countsFromStarters(actualEls.map((e) => e.element_type));
    const actualFormation = actualCounts ? formationLabel(actualCounts) : null;

    const predIds = new Set(pred.players.map((p) => p.id));
    const actualIds = new Set(actualEls.map((e) => e.id));

    const defSlots = assignActualSlots(actualEls, 'DEF');
    const midSlots = assignActualSlots(actualEls, 'MID');
    const fwdSlots = assignActualSlots(actualEls, 'FWD');
    const predById = new Map(pred.players.map((p) => [p.id, p]));

    let xiHits = 0;
    let xiMisses = 0;
    let xiFalsePositives = 0;
    let roleHits = 0;
    let roleCompared = 0;

    const squad = predictedLineupPoolElements(bootstrap, pred.teamId, targetGw);
    for (const el of squad) {
      const predictedStarter = predIds.has(el.id);
      const actualStarter = actualIds.has(el.id);
      const p = predById.get(el.id);
      const line =
        el.element_type === 2 ? 'DEF' : el.element_type === 3 ? 'MID' : el.element_type === 4 ? 'FWD' : null;
      const slotMap =
        line === 'DEF' ? defSlots : line === 'MID' ? midSlots : line === 'FWD' ? fwdSlots : null;
      const actualSlot = slotMap?.get(el.id);

      let verdict: Verdict;
      if (predictedStarter && actualStarter) verdict = 'correct_starter';
      else if (!predictedStarter && actualStarter) verdict = 'missed_starter';
      else if (predictedStarter && !actualStarter) verdict = 'false_starter';
      else verdict = 'bench_both';

      if (predictedStarter && actualStarter) xiHits++;
      if (!predictedStarter && actualStarter) xiMisses++;
      if (predictedStarter && !actualStarter) xiFalsePositives++;

      const predictedRole = p && line ? getPlayerTacticalRole(el.code) : null;
      const actualRole = actualSlot?.role ?? null;
      if (predictedStarter && actualStarter && predictedRole && actualRole) {
        roleCompared++;
        if (predictedRole === actualRole) roleHits++;
      }

      playerRows.push({
        gameweek: targetGw,
        teamShort: pred.shortName,
        webName: el.web_name,
        elementId: el.id,
        fplCode: el.code,
        fplLine: fplLineLabel(el.element_type),
        predictedStarter,
        actualStarter,
        predictedRole,
        predictedLane: p?.lane ?? null,
        actualRole: actualRole ?? null,
        actualLane: actualSlot?.lane ?? null,
        verdict,
      });
    }

    teamSummaries.push({
      gameweek: targetGw,
      teamShort: pred.shortName,
      fixtureId: fixture.id,
      opponent: opp,
      predictedFormation: pred.formation.label,
      actualFormation,
      formationMatch: actualFormation === pred.formation.label,
      xiHits,
      xiMisses,
      xiFalsePositives,
      roleHits,
      roleCompared,
    });
  }

  return { playerRows, teamSummaries };
}

interface TeamAggregate {
  teamShort: string;
  gameweeks: number;
  xiHits: number;
  xiMisses: number;
  xiFalsePositives: number;
  formationMatches: number;
  avgXiCorrect: number;
}

interface LineAggregate {
  line: string;
  missed: number;
  falsePositives: number;
  correct: number;
}

interface RepeatError {
  teamShort: string;
  webName: string;
  elementId: number;
  missedCount: number;
  falsePositiveCount: number;
}

function buildAggregates(
  allRows: PlayerRow[],
  allTeams: TeamGwSummary[],
  targetGws: number[]
): {
  byTeam: TeamAggregate[];
  byLine: LineAggregate[];
  byGw: Array<{ gameweek: number; metrics: StarterMetrics; formationMatches: string }>;
  repeatMisses: RepeatError[];
  repeatFalsePositives: RepeatError[];
  laneMismatches: number;
} {
  const byGw = targetGws.map((gw) => {
    const teams = allTeams.filter((t) => t.gameweek === gw);
    const hits = teams.reduce((s, t) => s + t.xiHits, 0);
    const misses = teams.reduce((s, t) => s + t.xiMisses, 0);
    const fp = teams.reduce((s, t) => s + t.xiFalsePositives, 0);
    const fm = teams.filter((t) => t.formationMatch).length;
    return {
      gameweek: gw,
      metrics: computeMetrics(hits, misses, fp),
      formationMatches: `${fm}/20`,
    };
  });

  const teamMap = new Map<string, TeamAggregate>();
  for (const t of allTeams) {
    const prev = teamMap.get(t.teamShort) ?? {
      teamShort: t.teamShort,
      gameweeks: 0,
      xiHits: 0,
      xiMisses: 0,
      xiFalsePositives: 0,
      formationMatches: 0,
      avgXiCorrect: 0,
    };
    prev.gameweeks++;
    prev.xiHits += t.xiHits;
    prev.xiMisses += t.xiMisses;
    prev.xiFalsePositives += t.xiFalsePositives;
    if (t.formationMatch) prev.formationMatches++;
    teamMap.set(t.teamShort, prev);
  }
  const byTeam = [...teamMap.values()]
    .map((t) => ({
      ...t,
      avgXiCorrect: t.xiHits / (t.gameweeks * 11),
      xiAccuracy: computeMetrics(t.xiHits, t.xiMisses, t.xiFalsePositives),
    }))
    .sort((a, b) => a.avgXiCorrect - b.avgXiCorrect);

  const lineStats = new Map<string, LineAggregate>();
  for (const r of allRows) {
    if (r.verdict === 'bench_both') continue;
    const line = r.fplLine;
    const s = lineStats.get(line) ?? { line, missed: 0, falsePositives: 0, correct: 0 };
    if (r.verdict === 'missed_starter') s.missed++;
    else if (r.verdict === 'false_starter') s.falsePositives++;
    else s.correct++;
    lineStats.set(line, s);
  }
  const byLine = [...lineStats.values()].sort((a, b) => b.missed + b.falsePositives - (a.missed + a.falsePositives));

  const playerErr = new Map<
    number,
    { teamShort: string; webName: string; elementId: number; missed: number; fp: number }
  >();
  for (const r of allRows) {
    if (r.verdict !== 'missed_starter' && r.verdict !== 'false_starter') continue;
    const p = playerErr.get(r.elementId) ?? {
      teamShort: r.teamShort,
      webName: r.webName,
      elementId: r.elementId,
      missed: 0,
      fp: 0,
    };
    if (r.verdict === 'missed_starter') p.missed++;
    else p.fp++;
    playerErr.set(r.elementId, p);
  }
  const repeatMisses = [...playerErr.values()]
    .filter((p) => p.missed >= 2)
    .map((p) => ({
      teamShort: p.teamShort,
      webName: p.webName,
      elementId: p.elementId,
      missedCount: p.missed,
      falsePositiveCount: p.fp,
    }))
    .sort((a, b) => b.missedCount - a.missedCount)
    .slice(0, 25);
  const repeatFalsePositives = [...playerErr.values()]
    .filter((p) => p.fp >= 2)
    .map((p) => ({
      teamShort: p.teamShort,
      webName: p.webName,
      elementId: p.elementId,
      missedCount: p.missed,
      falsePositiveCount: p.fp,
    }))
    .sort((a, b) => b.falsePositiveCount - a.falsePositiveCount)
    .slice(0, 25);

  let laneMismatches = 0;
  for (const r of allRows) {
    if (r.verdict !== 'correct_starter') continue;
    if (r.predictedLane && r.actualLane && r.predictedLane !== r.actualLane) laneMismatches++;
  }

  return { byTeam, byLine, byGw, repeatMisses, repeatFalsePositives, laneMismatches };
}

async function main(): Promise<void> {
  const targetGws = parseTargetGameweeks(process.argv.slice(2));
  const rangeLabel = gameweekRangeLabel(targetGws);

  mkdirSync(OUT_DIR, { recursive: true });

  const bootstrap = await getOrFetchBootstrap(db);
  const season = deriveSeason(bootstrap.events);
  const allFixturesRaw = await getOrFetchAllFixtures(db);
  const summariesFull = await loadAllSummaries(bootstrap, season, targetGws);
  const previousSeason = await loadPreviousSeasonFormationsByTeam(db, season);

  const allPlayerRows: PlayerRow[] = [];
  const allTeamSummaries: TeamGwSummary[] = [];

  for (const gw of targetGws) {
    console.log(`Evaluating GW${gw}...`);
    const { playerRows, teamSummaries } = await evaluateGameweek(
      gw,
      bootstrap,
      allFixturesRaw,
      summariesFull,
      previousSeason
    );
    allPlayerRows.push(...playerRows);
    allTeamSummaries.push(...teamSummaries);

    const hits = teamSummaries.reduce((s, t) => s + t.xiHits, 0);
    const misses = teamSummaries.reduce((s, t) => s + t.xiMisses, 0);
    const fp = teamSummaries.reduce((s, t) => s + t.xiFalsePositives, 0);
    writeFileSync(
      join(OUT_DIR, `summary-gw${gw}.json`),
      JSON.stringify(
        {
          gameweek: gw,
          starterMetrics: computeMetrics(hits, misses, fp),
          formationMatches: `${teamSummaries.filter((t) => t.formationMatch).length}/20`,
          perTeam: teamSummaries,
        },
        null,
        2
      )
    );
  }

  const totalHits = allTeamSummaries.reduce((s, t) => s + t.xiHits, 0);
  const totalMisses = allTeamSummaries.reduce((s, t) => s + t.xiMisses, 0);
  const totalFp = allTeamSummaries.reduce((s, t) => s + t.xiFalsePositives, 0);
  const formationMatches = allTeamSummaries.filter((t) => t.formationMatch).length;

  const aggregates = buildAggregates(allPlayerRows, allTeamSummaries, targetGws);

  const combined: CombinedSummary = {
    gameweeks: targetGws,
    evaluatedAt: new Date().toISOString(),
    modelVersion: 'lineup-v4',
    modelChanges: [
      'v3 start score + FWD/MID gates + smart formation pick',
      'Display formation derived from picked XI counts (derived)',
      'Pitch lanes prefer last finished match slot (before target GW)',
    ],
    sampleSize: {
      teamMatches: allTeamSummaries.length,
      starterSlots: allTeamSummaries.length * 11,
    },
    starterMetrics: computeMetrics(totalHits, totalMisses, totalFp),
    formationMatches: `${formationMatches}/${allTeamSummaries.length}`,
    roleAccuracy: {
      matches: allTeamSummaries.reduce((s, t) => s + t.roleHits, 0),
      compared: allTeamSummaries.reduce((s, t) => s + t.roleCompared, 0),
      laneMismatchesOnCorrectXi: aggregates.laneMismatches,
    },
    byGameweek: aggregates.byGw,
    byTeam: aggregates.byTeam,
    byFplLine: aggregates.byLine,
    repeatMissedStarters: aggregates.repeatMisses,
    repeatFalsePositives: aggregates.repeatFalsePositives,
  };

  const summaryPath = join(OUT_DIR, `summary-gw${rangeLabel}.json`);
  writeFileSync(summaryPath, JSON.stringify(combined, null, 2));

  const reportPath = join(OUT_DIR, `REPORT-gw${rangeLabel}.md`);
  writeFileSync(reportPath, writeFactualReport(combined, rangeLabel, 'output'));

  const csvHeader =
    'gameweek,team,player,fpl_line,verdict,predicted_starter,actual_starter,predicted_role,predicted_lane,actual_role,actual_lane,element_id,fpl_code\n';
  const csvBody = allPlayerRows
    .filter((r) => r.verdict !== 'bench_both')
    .sort(
      (a, b) =>
        a.gameweek - b.gameweek ||
        a.teamShort.localeCompare(b.teamShort) ||
        a.verdict.localeCompare(b.verdict)
    )
    .map((r) =>
      [
        r.gameweek,
        r.teamShort,
        `"${r.webName.replace(/"/g, '""')}"`,
        r.fplLine,
        r.verdict,
        r.predictedStarter ? 'Y' : 'N',
        r.actualStarter ? 'Y' : 'N',
        r.predictedRole ?? '',
        r.predictedLane ?? '',
        r.actualRole ?? '',
        r.actualLane ?? '',
        r.elementId,
        r.fplCode,
      ].join(',')
    )
    .join('\n');
  writeFileSync(join(OUT_DIR, `comparison-gw${rangeLabel}.csv`), csvHeader + csvBody);

  writeFileSync(
    join(OUT_DIR, `manual-review-gw${rangeLabel}.csv`),
    'gameweek,team,player,your_check_correct_starter,notes\n' +
      allPlayerRows
        .filter((r) => r.verdict !== 'bench_both')
        .map(
          (r) =>
            `${r.gameweek},${r.teamShort},"${r.webName.replace(/"/g, '""')}",,`
        )
        .join('\n')
  );

  console.log(JSON.stringify(combined, null, 2));
  console.log(
    `\nWrote output/summary-gw${rangeLabel}.json, REPORT-gw${rangeLabel}.md, comparison-gw${rangeLabel}.csv`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => closeDb());
