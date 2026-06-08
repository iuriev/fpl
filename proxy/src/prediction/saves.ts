const SAVES_WINDOW = 8;
// League-average GK faces ~3 shots on target per game
const SAVES_PRIOR_PER90 = 3.0;

interface HistoryRow {
  minutes: number;
  saves: number;
}

export function expectedSavesPts(history: HistoryRow[], minsProb: number): number {
  const recent = history.slice(-SAVES_WINDOW).filter((h) => h.minutes > 0);
  if (recent.length === 0) return (SAVES_PRIOR_PER90 / 3) * minsProb;
  const avg = recent.reduce((s, h) => s + h.saves, 0) / recent.length;
  return (avg / 3) * minsProb;
}
