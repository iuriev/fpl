import type { PlayerPosition } from '../types';

const YELLOW_PRIOR: Record<PlayerPosition, number> = {
  FWD: 0.08,
  MID: 0.10,
  DEF: 0.12,
  GK: 0.02,
};

const YC_WINDOW = 10;
const YC_FULL_WEIGHT_GAMES = 8;

interface HistoryRow {
  minutes: number;
  yellowCards: number;
}

export function expectedYellowDeduction(
  position: PlayerPosition,
  history: HistoryRow[],
  minsProb: number,
): number {
  const recent = history.slice(-YC_WINDOW).filter((h) => h.minutes > 0);
  const prior = YELLOW_PRIOR[position];
  if (recent.length === 0) return prior * minsProb * -1;
  const rate = recent.reduce((s, h) => s + h.yellowCards, 0) / recent.length;
  const weight = Math.min(recent.length / YC_FULL_WEIGHT_GAMES, 1);
  const blended = weight * rate + (1 - weight) * prior;
  return blended * minsProb * -1;
}
