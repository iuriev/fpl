import type { PlayerPosition } from '../types';

const POS_GOAL_PTS: Record<PlayerPosition, number> = {
  GK: 6,
  DEF: 6,
  MID: 5,
  FWD: 4,
};

const POS_CS_PTS: Record<PlayerPosition, number> = {
  GK: 4,
  DEF: 4,
  MID: 1,
  FWD: 0,
};

export function modelXPts(
  position: PlayerPosition,
  xGoals: number,
  xAssists: number,
  csProb: number | null,
  lambdaAgainst: number,
  minsProb: number,
  defconPts: number,
): number {
  const p60 = Math.min(Math.max(minsProb, 0), 1);
  const appearance = (1 - p60) * 1 + p60 * 2;
  const goals = xGoals * (POS_GOAL_PTS[position] ?? 4);
  const assists = xAssists * 3;
  const cs =
    csProb !== null && POS_CS_PTS[position] > 0
      ? csProb * p60 * POS_CS_PTS[position]
      : 0;
  const gc =
    position === 'GK' || position === 'DEF'
      ? Math.floor((lambdaAgainst * p60) / 2) * -1
      : 0;
  return appearance + goals + assists + cs + gc + defconPts;
}
