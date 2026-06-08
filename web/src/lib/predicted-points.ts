import type {
  PlayerGameweekPrediction,
  PlayerPosition,
  PoolPlayer,
  PredictionsPreviewResponse,
  PredictionsResponse,
} from '@/types';

export type PredictionMetric = 'xPts' | 'xAssists';

export type PredictedPointsRowData = {
  player: PoolPlayer;
  displayValue: number;
  displayLabel: string;
  prediction?: PlayerGameweekPrediction;
};

export function formatCsProb(csProb: number | null): string {
  if (csProb == null) return '—';
  return `${Math.round(csProb * 100)}%`;
}

export function formatPredictionDecimal(value: number): string {
  return value.toFixed(1);
}

function metricValue(prediction: PlayerGameweekPrediction, metric: PredictionMetric): number {
  return metric === 'xPts' ? prediction.xPts : prediction.xAssists;
}

function metricLabel(metric: PredictionMetric): string {
  return metric === 'xPts' ? 'xPts' : 'xA';
}

export function buildPredictedPointsRows(
  players: PoolPlayer[],
  predictions: PredictionsResponse | undefined,
  metric: PredictionMetric = 'xPts',
): PredictedPointsRowData[] {
  const byCode = new Map(
    (predictions?.ready ? predictions.players : []).map((p) => [p.fplCode, p]),
  );

  return players
    .flatMap((player) => {
      const prediction = byCode.get(player.code);
      if (prediction == null && metric === 'xAssists') return [];
      const raw =
        prediction != null ? metricValue(prediction, metric) : parseFloat(player.expectedPoints);
      const displayValue = Number.isFinite(raw) ? raw : 0;
      if (metric === 'xAssists' && displayValue <= 0) return [];
      return [{
        player,
        displayValue,
        displayLabel: metricLabel(metric),
        prediction,
      }];
    })
    .sort((a, b) => b.displayValue - a.displayValue);
}

export function buildPreviewPlayerRows(
  players: PoolPlayer[],
  preview: PredictionsPreviewResponse | undefined,
  position: PlayerPosition,
  metric: PredictionMetric,
): PredictedPointsRowData[] {
  if (!preview?.ready) return [];

  const poolByCode = new Map(players.map((p) => [p.code, p]));
  const bucket =
    metric === 'xPts' ? preview.byXPts[position] : preview.byXAssists[position as 'FWD' | 'MID' | 'DEF'];

  if (!bucket) return [];

  return bucket
    .map((prediction) => {
      const player = poolByCode.get(prediction.fplCode);
      if (!player) return null;
      return {
        player,
        displayValue: metricValue(prediction, metric),
        displayLabel: metricLabel(metric),
        prediction,
      };
    })
    .filter((row): row is PredictedPointsRowData => row !== null);
}
