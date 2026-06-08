import type { PlayerPosition } from '../types';
import { expectedDefconPts, rollingDefconHitRate } from './defcon';
import { modelXPts } from './fpl-points';
import { blendXPts, inferConfidence } from './hybrid';
import { slugFromVaastav } from './team-names';
import {
  csProbAway,
  csProbHome,
  lambdaAway,
  lambdaHome,
} from './team-poisson';
import type {
  PlayerGameweekPrediction,
  PlayerGwFactRow,
  PredictionConfidence,
  TeamPoissonFit,
} from './types';

interface PlayerHistory {
  expectedGoals: number;
  expectedAssists: number;
  minutes: number;
  starts: number;
  defensiveContribution: number;
}

interface EnrichedFact extends PlayerGwFactRow {
  shareXg: number;
  shareXa: number;
}

const XA_RATE_WINDOW = 8;
const XA_RATE_FULL_WEIGHT_MINS = 360;

function defaultShare(position: string): { xg: number; xa: number } {
  if (position === 'FWD') return { xg: 0.12, xa: 0.06 };
  if (position === 'MID') return { xg: 0.08, xa: 0.1 };
  return { xg: 0.04, xa: 0.05 };
}

function defaultXaPer90(position: string): number {
  if (position === 'MID') return 0.14;
  if (position === 'FWD') return 0.08;
  if (position === 'DEF') return 0.05;
  return 0.01;
}

function rollingXaPer90(history: PlayerHistory[]): { rate: number; minutes: number } {
  const recent = history.slice(-XA_RATE_WINDOW);
  let totalXa = 0;
  let totalMins = 0;
  for (const h of recent) {
    totalXa += h.expectedAssists;
    totalMins += h.minutes;
  }
  if (totalMins <= 0) return { rate: 0, minutes: 0 };
  return { rate: (totalXa / totalMins) * 90, minutes: totalMins };
}

function blendedXaPer90(position: string, history: PlayerHistory[]): number {
  const prior = defaultXaPer90(position);
  const { rate, minutes } = rollingXaPer90(history);
  if (minutes <= 0) return prior;
  const weight = Math.min(minutes / XA_RATE_FULL_WEIGHT_MINS, 1);
  return weight * rate + (1 - weight) * prior;
}

function fixtureAttackMultiplier(lamFor: number, fit: TeamPoissonFit): number {
  const baseline = Math.exp(fit.mu);
  if (baseline <= 0 || lamFor <= 0) return 1;
  return Math.sqrt(lamFor / baseline);
}

function predictXAssists(
  position: string,
  lamFor: number,
  fit: TeamPoissonFit,
  history: PlayerHistory[],
  minsProb: number,
): number {
  const xaPer90 = blendedXaPer90(position, history);
  const expectedMins = minsProb * 90;
  return xaPer90 * (expectedMins / 90) * fixtureAttackMultiplier(lamFor, fit);
}

function teamKeyForRow(row: PlayerGwFactRow): string {
  return row.teamName ?? String(row.teamId ?? '');
}

function teamMatchTotalsKey(row: PlayerGwFactRow): string {
  return `${row.season}|${row.round}|${teamKeyForRow(row)}`;
}

function buildTeamMatchTotals(
  rows: PlayerGwFactRow[],
): Map<string, { teamXg: number; teamXa: number }> {
  const totals = new Map<string, { teamXg: number; teamXa: number }>();
  for (const row of rows) {
    const key = teamMatchTotalsKey(row);
    const cur = totals.get(key) ?? { teamXg: 0, teamXa: 0 };
    cur.teamXg += row.expectedGoals;
    cur.teamXa += row.expectedAssists;
    totals.set(key, cur);
  }
  return totals;
}

function enrichWithShares(rows: PlayerGwFactRow[]): EnrichedFact[] {
  const teamTotals = buildTeamMatchTotals(rows);
  const byPlayer = new Map<number, PlayerGwFactRow[]>();
  for (const r of rows) {
    const list = byPlayer.get(r.element) ?? [];
    list.push(r);
    byPlayer.set(r.element, list);
  }

  const out: EnrichedFact[] = [];
  for (const [, playerRows] of byPlayer) {
    const sorted = [...playerRows].sort(
      (a, b) => a.round - b.round || a.fixture - b.fixture,
    );
    const hist: { xg: number; xa: number; teamXg: number; teamXa: number }[] = [];
    for (const row of sorted) {
      const matchTotals = teamTotals.get(teamMatchTotalsKey(row));
      const teamXg = matchTotals?.teamXg || 1e-6;
      const teamXa = matchTotals?.teamXa || 1e-6;
      let shareXg: number;
      let shareXa: number;
      if (hist.length > 0) {
        const recent = hist.slice(-5);
        const pXg = recent.reduce((s, h) => s + h.xg, 0);
        const tXg = recent.reduce((s, h) => s + h.teamXg, 0) || 1e-6;
        const pXa = recent.reduce((s, h) => s + h.xa, 0);
        const tXa = recent.reduce((s, h) => s + h.teamXa, 0) || 1e-6;
        shareXg = Math.min(1, pXg / tXg);
        shareXa = Math.min(1, pXa / tXa);
      } else {
        const d = defaultShare(row.position);
        shareXg = d.xg;
        shareXa = d.xa;
      }
      hist.push({
        xg: row.expectedGoals,
        xa: row.expectedAssists,
        teamXg,
        teamXa,
      });
      out.push({ ...row, shareXg, shareXa });
    }
  }
  return out;
}

function minutesProb(history: PlayerHistory[]): number {
  if (history.length === 0) return 0.7;
  const recent = history.slice(-5);
  const avg = recent.reduce((s, h) => s + h.minutes, 0) / recent.length;
  return Math.min(Math.max(avg / 90, 0.05), 1);
}

function predictFixture(
  row: EnrichedFact,
  fit: TeamPoissonFit,
  idToSlug: Map<number, string>,
  history: PlayerHistory[],
): Omit<PlayerGameweekPrediction, 'event'> & { round: number; fixture: number } {
  const position = row.position as PlayerPosition;
  const teamSlug =
    (row.teamName ? slugFromVaastav(row.teamName) : undefined) ??
    (row.teamId !== undefined ? idToSlug.get(row.teamId) : undefined);
  const oppSlug = idToSlug.get(row.opponentTeam);
  const homeSlug = row.wasHome ? teamSlug : oppSlug;
  const awaySlug = row.wasHome ? oppSlug : teamSlug;

  let lamFor = 0;
  let lamAgainst = 0;
  let csTeam: number | null = null;
  if (homeSlug && awaySlug && teamSlug) {
    if (row.wasHome) {
      lamFor = lambdaHome(fit, homeSlug, awaySlug);
      lamAgainst = lambdaAway(fit, homeSlug, awaySlug);
      csTeam = csProbHome(fit, homeSlug, awaySlug);
    } else {
      lamFor = lambdaAway(fit, homeSlug, awaySlug);
      lamAgainst = lambdaHome(fit, homeSlug, awaySlug);
      csTeam = csProbAway(fit, homeSlug, awaySlug);
    }
  }

  const minsProb = minutesProb(history);
  const xGoals = lamFor * row.shareXg * minsProb;
  const xAssists = predictXAssists(position, lamFor, fit, history, minsProb);

  const defconHit = rollingDefconHitRate(
    history.map((h) => ({
      minutes: h.minutes,
      defensiveContribution: h.defensiveContribution,
    })),
    position,
  );
  const defconPts = expectedDefconPts(defconHit, minsProb, position);

  let csProb: number | null = null;
  if ((position === 'GK' || position === 'DEF') && csTeam !== null) {
    csProb = csTeam * minsProb;
  }

  const mPts = modelXPts(
    position,
    xGoals,
    xAssists,
    csProb,
    lamAgainst,
    minsProb,
    defconPts,
  );

  const recent = history.slice(-5);
  const avgMins =
    recent.reduce((s, h) => s + h.minutes, 0) / Math.max(recent.length, 1);
  const startRate =
    recent.filter((h) => h.starts > 0).length / Math.max(recent.length, 1);
  const playedRecent = recent.filter((h) => h.minutes > 0).length;
  const confidence: PredictionConfidence = inferConfidence(
    playedRecent,
    avgMins,
    startRate,
  );

  const ep = row.xp;
  const xPts = blendXPts(mPts, ep, confidence);

  return {
    seasonElementId: row.element,
    round: row.round,
    fixture: row.fixture,
    xPts,
    xGoals,
    xAssists,
    csProb,
    defconPts,
    confidence,
    epNextAnchor: ep,
    modelXPts: mPts,
  };
}

function combineCs(probs: (number | null)[]): number | null {
  const valid = probs.filter((p): p is number => p !== null);
  if (valid.length === 0) return null;
  let p = 1;
  for (const v of valid) p *= 1 - v;
  return 1 - p;
}

export function scoreGameweekFacts(
  allFacts: PlayerGwFactRow[],
  fit: TeamPoissonFit,
  idToSlug: Map<number, string>,
  targetEvent: number,
  trainMaxGw: number,
): PlayerGameweekPrediction[] {
  const enriched = enrichWithShares(allFacts);
  const historyByEl = new Map<number, PlayerHistory[]>();
  const fixturePreds: ReturnType<typeof predictFixture>[] = [];

  const rounds = [...new Set(enriched.map((r) => r.round))].sort((a, b) => a - b);

  for (const round of rounds) {
    const gwRows = enriched.filter((r) => r.round === round);
    if (round === targetEvent && round > trainMaxGw) {
      for (const row of gwRows) {
        const hist = historyByEl.get(row.element) ?? [];
        fixturePreds.push(predictFixture(row, fit, idToSlug, hist));
      }
    }
    for (const row of gwRows) {
      const list = historyByEl.get(row.element) ?? [];
      list.push({
        expectedGoals: row.expectedGoals,
        expectedAssists: row.expectedAssists,
        minutes: row.minutes,
        starts: row.starts,
        defensiveContribution: row.defensiveContribution ?? 0,
      });
      historyByEl.set(row.element, list);
    }
  }

  const byPlayer = new Map<number, typeof fixturePreds>();
  for (const p of fixturePreds) {
    const list = byPlayer.get(p.seasonElementId) ?? [];
    list.push(p);
    byPlayer.set(p.seasonElementId, list);
  }

  const results: Omit<PlayerGameweekPrediction, 'fplCode'>[] = [];
  for (const [seasonElementId, fixtures] of byPlayer) {
    results.push({
      seasonElementId,
      event: targetEvent,
      xGoals: fixtures.reduce((s, f) => s + f.xGoals, 0),
      xAssists: fixtures.reduce((s, f) => s + f.xAssists, 0),
      defconPts: fixtures.reduce((s, f) => s + f.defconPts, 0),
      modelXPts: fixtures.reduce((s, f) => s + f.modelXPts, 0),
      xPts: fixtures.reduce((s, f) => s + f.xPts, 0),
      epNextAnchor: fixtures.reduce((s, f) => s + f.epNextAnchor, 0),
      csProb: combineCs(fixtures.map((f) => f.csProb)),
      confidence: fixtures[0].confidence,
    });
  }
  return results;
}
