import type { FPLBootstrapStatic } from '../fpl-client';

export type SeasonState = 'pre-season' | 'active' | 'complete';

export function deriveSeason(events: FPLBootstrapStatic['events']): string {
  const gw1 = events.find((e) => e.id === 1);
  if (!gw1) throw new Error('GW1 not found in bootstrap events');
  const year = new Date(gw1.deadline_time).getUTCFullYear();
  const nextYearShort = String(year + 1).slice(-2);
  return `${year}-${nextYearShort}`;
}

export function getSeasonState(
  events: FPLBootstrapStatic['events'],
  isComplete: boolean,
): SeasonState {
  if (isComplete) return 'complete';
  if (events.some((e) => e.is_current)) return 'active';
  return 'pre-season';
}

export function getBootstrapTtlSeconds(state: SeasonState): number {
  if (state === 'complete') return 604800; // 1 week
  return 43200; // 12 hours for both pre-season and active
}

export function getLiveTtlSeconds(): number {
  return 10800; // 3 hours
}

export function latestFinishedGw(events: FPLBootstrapStatic['events']): number | null {
  const finished = events.filter((e) => e.finished);
  if (finished.length === 0) return null;
  return finished[finished.length - 1].id;
}
