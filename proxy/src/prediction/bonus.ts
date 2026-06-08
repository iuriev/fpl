import type { PlayerPosition } from '../types';

const BONUS_PRIOR: Record<PlayerPosition, number> = {
  FWD: 0.39,
  MID: 0.16,
  DEF: 0.12,
  GK: 0.16,
};

const BONUS_WINDOW = 10;
const BONUS_FULL_WEIGHT_GAMES = 8;

// Empirical avg bonus pts by number of goal involvements (goals + assists) in a match.
// Calibrated from 2024-25 EPL season (N ≈ 11 000 player-game rows, minutes > 0).
const BONUS_RATE_BY_GI = [0.042, 0.860, 2.224, 2.690];

interface HistoryRow {
  minutes: number;
  bonus: number;
}

function rollingBonusPts(history: HistoryRow[]): { rate: number; games: number } {
  const recent = history.slice(-BONUS_WINDOW).filter((h) => h.minutes > 0);
  if (recent.length === 0) return { rate: 0, games: 0 };
  const avg = recent.reduce((s, h) => s + h.bonus, 0) / recent.length;
  return { rate: avg, games: recent.length };
}

function blendedBonusRate(position: PlayerPosition, history: HistoryRow[]): number {
  const { rate, games } = rollingBonusPts(history);
  if (games === 0) return BONUS_PRIOR[position];
  const weight = Math.min(games / BONUS_FULL_WEIGHT_GAMES, 1);
  return weight * rate + (1 - weight) * BONUS_PRIOR[position];
}

export function contextBonusPts(xGoals: number, xAssists: number): number {
  const lambda = xGoals + xAssists;
  const p0 = Math.exp(-lambda);
  const p1 = lambda * Math.exp(-lambda);
  const p2 = ((lambda ** 2) / 2) * Math.exp(-lambda);
  const p3plus = Math.max(0, 1 - p0 - p1 - p2);
  return (
    p0 * BONUS_RATE_BY_GI[0] +
    p1 * BONUS_RATE_BY_GI[1] +
    p2 * BONUS_RATE_BY_GI[2] +
    p3plus * BONUS_RATE_BY_GI[3]
  );
}

export function expectedBonusPts(
  position: PlayerPosition,
  history: HistoryRow[],
  xGoals: number,
  xAssists: number,
  minsProb: number,
): number {
  if (position === 'GK') {
    return blendedBonusRate('GK', history) * minsProb;
  }
  const ctx = contextBonusPts(xGoals, xAssists);
  const roll = blendedBonusRate(position, history);
  return (0.5 * ctx + 0.5 * roll) * minsProb;
}
