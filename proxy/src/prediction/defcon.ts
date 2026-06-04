import type { PlayerPosition } from '../types';

const THRESHOLD: Partial<Record<PlayerPosition, number>> = {
  DEF: 10,
  MID: 12,
  FWD: 12,
};

const PRIOR_HIT: Partial<Record<PlayerPosition, number>> = {
  DEF: 0.38,
  MID: 0.28,
  FWD: 0.06,
  GK: 0,
};

const DEFCON_PTS = 2;

interface HistoryRow {
  minutes: number;
  defensiveContribution: number;
}

export function rollingDefconHitRate(
  history: HistoryRow[],
  position: PlayerPosition,
  window = 8,
): number {
  if (position === 'GK') return 0;
  const threshold = THRESHOLD[position] ?? 12;
  const played = history.filter((h) => h.minutes >= 60).slice(-window);
  const prior = PRIOR_HIT[position] ?? 0.1;
  if (played.length === 0) return prior;
  const hits = played.filter((h) => h.defensiveContribution >= threshold).length;
  const rate = hits / played.length;
  return (rate * played.length + prior * 3) / (played.length + 3);
}

export function expectedDefconPts(
  hitRate: number,
  minsProb: number,
  position: PlayerPosition,
): number {
  if (position === 'GK') return 0;
  return DEFCON_PTS * hitRate * minsProb;
}
