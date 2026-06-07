import type { FixtureInfo, PlayerGameweekPrediction, PlayerPosition } from '@/types';

const CS_POSITIONS = new Set<PlayerPosition>(['GKP', 'DEF']);
const CS_THRESHOLD = 0.35;

export function buildPredictionBlurb(
  prediction: PlayerGameweekPrediction,
  position: PlayerPosition,
  firstFixture: FixtureInfo | undefined,
): string {
  const xPtsFormatted = prediction.xPts.toFixed(1);

  let sentence1: string;
  if (firstFixture) {
    const homeAway = firstFixture.home ? 'H' : 'A';
    sentence1 = `Faces ${firstFixture.opponent} (${homeAway}) (FDR ${firstFixture.difficulty}) — ${xPtsFormatted} xPts expected.`;
  } else {
    sentence1 = `${xPtsFormatted} xPts expected (no upcoming fixture).`;
  }

  const { csProb } = prediction;
  if (CS_POSITIONS.has(position) && csProb != null && csProb >= CS_THRESHOLD) {
    sentence1 += ` CS chance ${Math.round(csProb * 100)}%.`;
  }

  const sentence2 =
    prediction.confidence === 'low'
      ? ' Low confidence — limited data or rotation risk.'
      : '';

  return sentence1 + sentence2;
}
