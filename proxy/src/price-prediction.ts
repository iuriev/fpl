export type PredictionLikelihood = 'unlikely' | 'likely' | 'very_likely';
export type PredictionDirection = 'rise' | 'fall';

const BASE_THRESHOLD = 40_000;
const OWNERSHIP_FACTOR = 600;
const VERY_LIKELY_MULTIPLIER = 1.5;

export function thresholdForOwnership(selectedByPercent: string): number {
  const ownership = parseFloat(selectedByPercent) || 0;
  return BASE_THRESHOLD + OWNERSHIP_FACTOR * ownership;
}

export function netTransfersEvent(transfersIn: number, transfersOut: number): number {
  return transfersIn - transfersOut;
}

export function transferInPercent(transfersIn: number, transfersOut: number): number | null {
  const total = transfersIn + transfersOut;
  if (total <= 0) return null;
  return Math.round((transfersIn / total) * 1000) / 10;
}

export function predictLikelihood(
  net: number,
  direction: PredictionDirection,
  threshold: number
): PredictionLikelihood {
  if (direction === 'rise') {
    if (net >= threshold * VERY_LIKELY_MULTIPLIER) return 'very_likely';
    if (net >= threshold) return 'likely';
    return 'unlikely';
  }
  if (net <= -threshold * VERY_LIKELY_MULTIPLIER) return 'very_likely';
  if (net <= -threshold) return 'likely';
  return 'unlikely';
}
