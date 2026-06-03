import type { FPLBootstrapStatic } from './fpl-client';
import { MAX_GAMEWEEK } from './types';

export function resolveNextGw(bootstrap: FPLBootstrapStatic): number {
  const next = bootstrap.events.find((e) => e.is_next);
  if (next) return next.id;
  const current = bootstrap.events.find((e) => e.is_current);
  if (current) return Math.min(current.id + 1, MAX_GAMEWEEK);
  const finished = bootstrap.events.filter((e) => e.finished);
  return finished.length > 0 ? Math.min(finished[finished.length - 1].id + 1, MAX_GAMEWEEK) : 1;
}
