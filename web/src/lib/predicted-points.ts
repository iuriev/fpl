import type {
  PlayerGameweekPrediction,
  PlayerPosition,
  PoolPlayer,
  PredictionsPreviewResponse,
  PredictionsResponse,
} from '@/types';

export type PredictionMetric = 'xPts' | 'xAssists' | 'xGoals';

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
  return (Number.isFinite(value) ? value : 0).toFixed(1);
}

function metricValue(prediction: PlayerGameweekPrediction, metric: PredictionMetric): number {
  if (metric === 'xPts') return prediction.xPts;
  if (metric === 'xAssists') return prediction.xAssists;
  return prediction.xGoals;
}

function metricLabel(metric: PredictionMetric): string {
  if (metric === 'xPts') return 'xPts';
  if (metric === 'xAssists') return 'xA';
  return 'xG';
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
      if (prediction == null && (metric === 'xAssists' || metric === 'xGoals')) return [];
      const raw =
        prediction != null ? metricValue(prediction, metric) : parseFloat(player.expectedPoints);
      const displayValue = Number.isFinite(raw) ? raw : 0;
      if ((metric === 'xAssists' || metric === 'xGoals') && displayValue <= 0) return [];
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
    metric === 'xPts'
      ? preview.byXPts[position]
      : metric === 'xAssists'
        ? preview.byXAssists[position as 'FWD' | 'MID' | 'DEF']
        : preview.byXGoals[position as 'FWD' | 'MID' | 'DEF'];

  if (!bucket) return [];

  return bucket
    .map((prediction) => {
      const player = poolByCode.get(prediction.fplCode);
      if (!player) return null;
      const raw = metricValue(prediction, metric);
      return {
        player,
        displayValue: Number.isFinite(raw) ? raw : 0,
        displayLabel: metricLabel(metric),
        prediction,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}
