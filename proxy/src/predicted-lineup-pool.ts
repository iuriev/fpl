import type { FPLBootstrapStatic } from './fpl-client';

export function isFirstPredictedGameweek(targetGw: number): boolean {
  return targetGw <= 1;
}

export function hasSeasonMinutes(
  el: Pick<FPLBootstrapStatic['elements'][number], 'minutes'>
): boolean {
  return el.minutes > 0;
}

export function predictedLineupPoolElements(
  bootstrap: FPLBootstrapStatic,
  teamId: number,
  targetGw: number
): FPLBootstrapStatic['elements'] {
  const seasonStarted = !isFirstPredictedGameweek(targetGw);
  return bootstrap.elements.filter((el) => {
    if (el.team !== teamId) return false;
    if (hasSeasonMinutes(el)) return true;
    return !seasonStarted;
  });
}
