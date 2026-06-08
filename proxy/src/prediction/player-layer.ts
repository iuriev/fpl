import type { TeamSlugLookup } from '../fpl-identity/team-slug-lookup';
import type { PlayerPosition } from '../types';
import { expectedBonusPts } from './bonus';
import { expectedDefconPts, rollingDefconHitRate } from './defcon';
import { modelXPts } from './fpl-points';
import { blendXPts, inferConfidence } from './hybrid';
import { expectedSavesPts } from './saves';
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
import { expectedYellowDeduction } from './yellow-card';

export type { TeamSlugLookup } from '../fpl-identity/team-slug-lookup';

// xG priors by tactical role (xG/90 for an average player in that role)
const XG_PRIOR_BY_ROLE: Record<string, number> = {
  st: 0.30,   // Striker
  rw: 0.15,   // Right Winger
  lw: 0.15,   // Left Winger
  am: 0.12,   // Attacking MID / CAM
  cm: 0.08,   // Central MID
  dm: 0.04,   // Defensive MID
  rb: 0.04,   // Attacking fullback
  lb: 0.04,
  cb: 0.02,   // Centre-back
  gk: 0.01,
};

// Fallback xG prior by FPL position when tactical role is unknown
const XG_PRIOR_BY_POSITION: Record<string, number> = {
  FWD: 0.28,
  MID: 0.10,
  DEF: 0.03,
  GK: 0.01,
};

const XA_PRIOR_BY_ROLE: Record<string, number> = {
  am: 0.32,   // Attacking MID / CAM
  rw: 0.28,   // Right Winger
  lw: 0.28,   // Left Winger
  cm: 0.16,   // Central MID
  dm: 0.07,   // Defensive MID
  st: 0.18,   // Striker (attacking)
  rb: 0.16,   // Attacking fullback (Trent-type)
  lb: 0.16,   // Attacking fullback
  cb: 0.05,   // Centre-back
  gk: 0.01,   // Goalkeeper
};

// Fallback prior by FPL position when tactical role is unknown
const XA_PRIOR_BY_POSITION: Record<string, number> = {
  MID: 0.22,
  FWD: 0.18,
  DEF: 0.08,
  GK: 0.01,
};

// League-average xG/90 for a striker (used as baseline for teamFinishingMultiplier)
const LEAGUE_AVG_STRIKER_XG_PER90 = 0.28;

interface PlayerHistory {
  expectedGoals: number;
  expectedAssists: number;
  minutes: number;
  starts: number;
  defensiveContribution: number;
  bonus: number;
  yellowCards: number;
  saves: number;
  cleanSheets: number;
}

const XA_RATE_WINDOW = 12;
const XA_RATE_FULL_WEIGHT_MINS = 540;

function defaultXgPer90(position: string, tacticalRole?: string): number {
  if (tacticalRole) {
    const rolePrior = XG_PRIOR_BY_ROLE[tacticalRole];
    if (rolePrior !== undefined) return rolePrior;
  }
  return XG_PRIOR_BY_POSITION[position] ?? 0.01;
}

function rollingXgPer90(history: PlayerHistory[]): { rate: number; minutes: number } {
  const recent = history.slice(-XA_RATE_WINDOW);
  let totalXg = 0;
  let totalMins = 0;
  for (const h of recent) {
    totalXg += h.expectedGoals;
    totalMins += h.minutes;
  }
  if (totalMins <= 0) return { rate: 0, minutes: 0 };
  return { rate: (totalXg / totalMins) * 90, minutes: totalMins };
}

function blendedXgPer90(
  position: string,
  history: PlayerHistory[],
  tacticalRole?: string,
): number {
  const prior = defaultXgPer90(position, tacticalRole);
  const { rate, minutes } = rollingXgPer90(history);
  if (minutes <= 0) return prior;
  const weight = Math.min(minutes / XA_RATE_FULL_WEIGHT_MINS, 1);
  return weight * rate + (1 - weight) * prior;
}

function defaultXaPer90(position: string, tacticalRole?: string): number {
  if (tacticalRole) {
    const rolePrior = XA_PRIOR_BY_ROLE[tacticalRole];
    if (rolePrior !== undefined) return rolePrior;
  }
  return XA_PRIOR_BY_POSITION[position] ?? 0.01;
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

function blendedXaPer90(
  position: string,
  history: PlayerHistory[],
  tacticalRole?: string,
): number {
  const prior = defaultXaPer90(position, tacticalRole);
  const { rate, minutes } = rollingXaPer90(history);
  if (minutes <= 0) return prior;
  const weight = Math.min(minutes / XA_RATE_FULL_WEIGHT_MINS, 1);
  return weight * rate + (1 - weight) * prior;
}

// Fixture attack multiplier: λ_for / league_baseline.
// Returns 1 when λ_for is unknown (no slug match) → league-average fixture.
function fixtureAttackMultiplier(lamFor: number, fit: TeamPoissonFit): number {
  const baseline = Math.exp(fit.mu);
  if (baseline <= 0 || lamFor <= 0) return 1;
  return lamFor / baseline;
}

// Multiplier based on quality of team's attacking partners (strikers' xG/90)
// Higher-quality finishers → more goals → more assist opportunities
function teamFinishingMultiplier(
  teamXgPer90: number | undefined,
): number {
  if (!teamXgPer90 || teamXgPer90 <= 0) return 1;
  const ratio = teamXgPer90 / LEAGUE_AVG_STRIKER_XG_PER90;
  // Clamp between 0.6 and 1.5 to avoid extreme outliers
  return Math.min(Math.max(ratio, 0.6), 1.5);
}

function predictXAssists(
  position: string,
  lamFor: number,
  fit: TeamPoissonFit,
  history: PlayerHistory[],
  minsProb: number,
  tacticalRole?: string,
  teamXgPer90?: number,
): number {
  const xaPer90 = blendedXaPer90(position, history, tacticalRole);
  const expectedMins = minsProb * 90;
  return (
    xaPer90 *
    (expectedMins / 90) *
    fixtureAttackMultiplier(lamFor, fit) *
    teamFinishingMultiplier(teamXgPer90)
  );
}

function minutesProb(history: PlayerHistory[]): number {
  if (history.length === 0) return 0.5;
  const recent = history.slice(-5);
  const avg = recent.reduce((s, h) => s + h.minutes, 0) / recent.length;
  return Math.min(Math.max(avg / 90, 0.05), 1);
}

function prob60Plus(history: PlayerHistory[]): number {
  if (history.length === 0) return 0.5;
  const recent = history.slice(-5);
  const over60 = recent.filter((h) => h.minutes >= 60).length;
  return over60 / recent.length;
}

function predictFixture(
  row: PlayerGwFactRow,
  fit: TeamPoissonFit,
  resolveTeamSlug: TeamSlugLookup,
  history: PlayerHistory[],
  tacticalRole?: string,
  teamXgPer90?: number,
): Omit<PlayerGameweekPrediction, 'event' | 'fplCode'> & { round: number; fixture: number } {
  const position = row.position as PlayerPosition;
  const teamSlug =
    (row.teamName ? resolveTeamSlug(row.teamName) : undefined) ??
    (row.teamId !== undefined ? resolveTeamSlug(row.teamId) : undefined);
  const oppSlug = resolveTeamSlug(row.opponentTeam);
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
  const p60 = prob60Plus(history);

  const xgPer90 = blendedXgPer90(position, history, tacticalRole);
  const xGoals = xgPer90 * fixtureAttackMultiplier(lamFor, fit) * minsProb;

  const xAssists = predictXAssists(
    position,
    lamFor,
    fit,
    history,
    minsProb,
    tacticalRole,
    teamXgPer90,
  );

  const defconHit = rollingDefconHitRate(
    history.map((h) => ({
      minutes: h.minutes,
      defensiveContribution: h.defensiveContribution,
    })),
    position,
  );
  const defconPts = expectedDefconPts(defconHit, minsProb, position);

  let csProb: number | null = null;
  if (
    (position === 'GK' || position === 'DEF' || position === 'MID') &&
    csTeam !== null
  ) {
    csProb = csTeam * minsProb;
  }

  const bonusPts = expectedBonusPts(position, history, xGoals, xAssists, minsProb);
  const savesPts = position === 'GK' ? expectedSavesPts(history, minsProb) : 0;
  const yellowDeduction = expectedYellowDeduction(position, history, minsProb);

  const mPts = modelXPts(
    position,
    xGoals,
    xAssists,
    csProb,
    lamAgainst,
    minsProb,
    p60,
    defconPts,
    bonusPts,
    savesPts,
    yellowDeduction,
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

function teamKeyForRow(row: PlayerGwFactRow): string {
  return row.teamName ?? String(row.teamId ?? '');
}

// Build a map of teamKey → average xG/90 of top-2 attackers (proxy for finishing quality)
function buildTeamFinishingMap(
  facts: PlayerGwFactRow[],
  targetRound: number,
): Map<string, number> {
  const trainFacts = facts.filter((r) => r.round < targetRound);
  const playerXgMins = new Map<string, { xg: number; mins: number }>();
  for (const r of trainFacts) {
    const key = `${teamKeyForRow(r)}|${r.element}`;
    const cur = playerXgMins.get(key) ?? { xg: 0, mins: 0 };
    cur.xg += r.expectedGoals;
    cur.mins += r.minutes;
    playerXgMins.set(key, cur);
  }
  // Group by team, compute xG/90 per player, take avg of top-2
  const teamPlayers = new Map<string, number[]>();
  for (const [key, { xg, mins }] of playerXgMins) {
    if (mins < 90) continue;
    const teamKey = key.split('|')[0];
    const xgPer90 = (xg / mins) * 90;
    const list = teamPlayers.get(teamKey) ?? [];
    list.push(xgPer90);
    teamPlayers.set(teamKey, list);
  }
  const result = new Map<string, number>();
  for (const [teamKey, rates] of teamPlayers) {
    const top2 = rates.sort((a, b) => b - a).slice(0, 2);
    result.set(teamKey, top2.reduce((s, v) => s + v, 0) / top2.length);
  }
  return result;
}

export function scoreGameweekFacts(
  allFacts: PlayerGwFactRow[],
  fit: TeamPoissonFit,
  resolveTeamSlug: TeamSlugLookup,
  targetEvent: number,
  trainMaxGw: number,
  tacticalRoles?: Map<number, string>,
): Omit<PlayerGameweekPrediction, 'fplCode'>[] {
  const historyByEl = new Map<number, PlayerHistory[]>();
  const fixturePreds: ReturnType<typeof predictFixture>[] = [];
  const teamFinishingMap = buildTeamFinishingMap(allFacts, targetEvent);

  const rounds = [...new Set(allFacts.map((r) => r.round))].sort((a, b) => a - b);
  const uniquePlayers = new Set(allFacts.map((r) => r.element)).size;
  console.log(
    `[pred:score:layer] target_event=${targetEvent} train_max_gw=${trainMaxGw}` +
    ` rounds=${rounds.length} players=${uniquePlayers} facts=${allFacts.length}`,
  );

  for (const round of rounds) {
    const gwRows = allFacts.filter((r) => r.round === round);
    if (round === targetEvent && round > trainMaxGw) {
      console.log(
        `[pred:score:layer] scoring target round=${round} fixture_rows=${gwRows.length}` +
        ` players_with_history=${historyByEl.size}`,
      );
      for (const row of gwRows) {
        const hist = historyByEl.get(row.element) ?? [];
        const teamKey = teamKeyForRow(row);
        const teamXgPer90 = teamFinishingMap.get(teamKey);
        const tacticalRole = tacticalRoles?.get(row.element);
        fixturePreds.push(
          predictFixture(row, fit, resolveTeamSlug, hist, tacticalRole, teamXgPer90),
        );
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
        bonus: row.bonus ?? 0,
        yellowCards: row.yellowCards ?? 0,
        saves: row.saves ?? 0,
        cleanSheets: row.cleanSheets ?? 0,
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
