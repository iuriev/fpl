import type { PredictedLineupPlayer } from '@/types';

export const PREDICTED_LINEUP_DISPLAY_XMINS_MIN = 60;

export function displayPredictedXMins(xMins: number): number {
  return Math.max(PREDICTED_LINEUP_DISPLAY_XMINS_MIN, xMins);
}

export function hasLineupPlayRisk(
  player: Pick<PredictedLineupPlayer, 'injuryWarning' | 'benchRisk'>
): boolean {
  return player.injuryWarning || player.benchRisk;
}
