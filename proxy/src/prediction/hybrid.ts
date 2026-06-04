import type { PredictionConfidence } from './types';

const EP_WEIGHT: Record<PredictionConfidence, number> = {
  high: 0.25,
  medium: 0.45,
  low: 0.65,
};

export function blendXPts(
  modelXPts: number,
  epNext: number,
  confidence: PredictionConfidence,
): number {
  const w = EP_WEIGHT[confidence];
  return (1 - w) * modelXPts + w * epNext;
}

export function inferConfidence(
  sampleGws: number,
  avgMinutes: number,
  startRate: number,
): PredictionConfidence {
  if (sampleGws < 3 || avgMinutes < 45) return 'low';
  if (sampleGws >= 5 && startRate >= 0.75 && avgMinutes >= 70) return 'high';
  return 'medium';
}
