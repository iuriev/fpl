import { describe, expect, it } from 'vitest';

import type { FPLBootstrapStatic } from '../fpl-client';
import {
  deriveSeason,
  getBootstrapTtlSeconds,
  getLiveTtlSeconds,
  getSeasonState,
  latestFinishedGw,
} from './season';

type Event = FPLBootstrapStatic['events'][0];

function makeEvent(overrides: Partial<Event> & { id: number }): Event {
  return {
    name: `Gameweek ${overrides.id}`,
    deadline_time: '2025-08-01T11:00:00Z',
    is_current: false,
    is_next: false,
    finished: false,
    average_entry_score: 0,
    highest_score: 0,
    data_checked: false,
    ...overrides,
  };
}

const gw1Aug2025 = makeEvent({ id: 1, deadline_time: '2025-08-16T11:00:00Z' });
const gw1Aug2026 = makeEvent({ id: 1, deadline_time: '2026-08-15T11:00:00Z' });

describe('deriveSeason', () => {
  it('derives season from GW1 deadline year', () => {
    expect(deriveSeason([gw1Aug2025])).toBe('2025-26');
  });

  it('handles new season rollover', () => {
    expect(deriveSeason([gw1Aug2026])).toBe('2026-27');
  });

  it('throws if GW1 is missing', () => {
    expect(() => deriveSeason([makeEvent({ id: 2 })])).toThrow('GW1 not found');
  });
});

describe('getSeasonState', () => {
  const events = [gw1Aug2025, makeEvent({ id: 2 })];

  it('returns complete when isComplete=true regardless of events', () => {
    const activeEvents = [makeEvent({ id: 1, is_current: true, deadline_time: '2025-08-16T11:00:00Z' })];
    expect(getSeasonState(activeEvents, true)).toBe('complete');
  });

  it('returns active when an event has is_current=true', () => {
    const activeEvents = [
      gw1Aug2025,
      makeEvent({ id: 2, is_current: true }),
    ];
    expect(getSeasonState(activeEvents, false)).toBe('active');
  });

  it('returns pre-season when no event is current', () => {
    expect(getSeasonState(events, false)).toBe('pre-season');
  });
});

describe('getBootstrapTtlSeconds', () => {
  it('returns 1 week for complete season', () => {
    expect(getBootstrapTtlSeconds('complete')).toBe(604800);
  });

  it('returns 12 hours for active season', () => {
    expect(getBootstrapTtlSeconds('active')).toBe(43200);
  });

  it('returns 12 hours for pre-season', () => {
    expect(getBootstrapTtlSeconds('pre-season')).toBe(43200);
  });
});

describe('getLiveTtlSeconds', () => {
  it('returns 3 hours', () => {
    expect(getLiveTtlSeconds()).toBe(10800);
  });
});

describe('latestFinishedGw', () => {
  it('returns null when no GWs are finished', () => {
    expect(latestFinishedGw([gw1Aug2025])).toBeNull();
  });

  it('returns the highest finished GW id', () => {
    const events = [
      makeEvent({ id: 1, deadline_time: '2025-08-16T11:00:00Z', finished: true }),
      makeEvent({ id: 2, deadline_time: '2025-08-23T11:00:00Z', finished: true }),
      makeEvent({ id: 3, deadline_time: '2025-08-30T11:00:00Z', finished: false }),
    ];
    expect(latestFinishedGw(events)).toBe(2);
  });

  it('returns 38 when all GWs are finished', () => {
    const events = Array.from({ length: 38 }, (_, i) =>
      makeEvent({ id: i + 1, deadline_time: '2025-08-16T11:00:00Z', finished: true }),
    );
    expect(latestFinishedGw(events)).toBe(38);
  });
});
