import { describe, expect, it } from 'vitest';

import type { FPLBootstrapStatic } from './fpl-client';
import { resolveNextGw } from './resolve-next-gw';

function event(
  id: number,
  opts: { is_current?: boolean; is_next?: boolean; finished?: boolean } = {}
): FPLBootstrapStatic['events'][number] {
  return {
    id,
    name: `Gameweek ${id}`,
    deadline_time: '2025-01-01T12:00:00Z',
    is_current: opts.is_current ?? false,
    is_next: opts.is_next ?? false,
    finished: opts.finished ?? false,
    data_checked: false,
    average_entry_score: 0,
    highest_score: 0,
  };
}

describe('resolveNextGw', () => {
  it('uses is_next when set', () => {
    const bootstrap: FPLBootstrapStatic = {
      events: [event(37, { is_current: true }), event(38, { is_next: true })],
      teams: [],
      elements: [],
      element_types: [],
      total_players: 0,
      chips: [],
    };
    expect(resolveNextGw(bootstrap)).toBe(38);
  });

  it('caps at 38 when current is the last gameweek', () => {
    const bootstrap: FPLBootstrapStatic = {
      events: [event(37, { finished: true }), event(38, { is_current: true })],
      teams: [],
      elements: [],
      element_types: [],
      total_players: 0,
      chips: [],
    };
    expect(resolveNextGw(bootstrap)).toBe(38);
  });
});
