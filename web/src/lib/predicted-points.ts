import type { PlayerGameweekPrediction, PoolPlayer, PredictionsResponse } from '@/types';

export type PredictedPointsRowData = {
  player: PoolPlayer;
  xPts: number;
  prediction?: PlayerGameweekPrediction;
};

export function formatCsProb(csProb: number | null): string {
  if (csProb == null) return '—';
  return `${Math.round(csProb * 100)}%`;
}

export function formatPredictionDecimal(value: number): string {
  return value.toFixed(1);
}

export function buildPredictedPointsRows(
  players: PoolPlayer[],
  predictions: PredictionsResponse | undefined,
): PredictedPointsRowData[] {
  const byCode = new Map(
    (predictions?.ready ? predictions.players : []).map((p) => [p.fplCode, p]),
  );

  return players
    .map((player) => {
      const prediction = byCode.get(player.code);
      const xPts =
        prediction != null ? prediction.xPts : parseFloat(player.expectedPoints);
      return {
        player,
        xPts: Number.isFinite(xPts) ? xPts : 0,
        prediction,
      };
    })
    .sort((a, b) => b.xPts - a.xPts);
}
