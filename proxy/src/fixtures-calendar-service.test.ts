import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as cacheLayer from './cache';
import { getFixturesCalendar } from './fixtures-calendar-service';
import * as dbCache from './fpl-cache/db-cache';
import * as fplFixturesCache from './fpl-fixtures-cache';

vi.mock('./db/client', () => ({ db: {} }));
vi.mock('./fpl-cache/db-cache');
vi.mock('./fpl-fixtures-cache');

function makeTeam(id: number, name: string, shortName: string) {
  return {
    id,
    name,
    short_name: shortName,
    code: id * 10,
    strength_overall_home: 1000 + id * 50,
    strength_overall_away: 1000 + id * 45,
    strength_attack_home: 900 + id * 60,
    strength_attack_away: 900 + id * 55,
    strength_defence_home: 1000 + id * 40,
    strength_defence_away: 1000 + id * 35,
  };
}

const TEAMS = Array.from({ length: 20 }, (_, i) => makeTeam(i + 1, `Team ${i + 1}`, `T${i + 1}`));

function makeEvent(id: number, isCurrent = false) {
  return {
    id,
    name: `Gameweek ${id}`,
    deadline_time: `2025-08-${String(id).padStart(2, '0')}T11:00:00Z`,
    is_current: isCurrent,
    is_next: false,
    finished: id < 30,
    data_checked: false,
    average_entry_score: 0,
    highest_score: 0,
  };
}

const EVENTS = Array.from({ length: 38 }, (_, i) => makeEvent(i + 1, i === 29));

const BOOTSTRAP = {
  total_players: 10000000,
  events: EVENTS,
  teams: TEAMS,
  elements: [],
  element_types: [],
  chips: [],
};

function makeFixture(
  id: number,
  gw: number,
  teamH: number,
  teamA: number,
  kickoffTime: string | null = `2025-08-${String(gw).padStart(2, '0')}T15:00:00Z`
) {
  return {
    id,
    event: gw,
    team_h: teamH,
    team_a: teamA,
    team_h_difficulty: 3,
    team_a_difficulty: 2,
    kickoff_time: kickoffTime,
    finished: gw < 30,
  };
}

describe('getFixturesCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValue(BOOTSTRAP as never);
    cacheLayer.clearCache();
  });

  it('detects DGW: team with two fixtures in same GW', async () => {
    vi.mocked(fplFixturesCache.getOrFetchAllFixtures).mockResolvedValue([
      makeFixture(1, 1, 1, 2, '2025-08-01T12:00:00Z'),
      makeFixture(2, 1, 1, 3, '2025-08-01T17:00:00Z'),
    ]);

    const result = await getFixturesCalendar();
    const team1Gw1 = result.byTeam[1].find((r) => r.gw === 1)!;
    expect(team1Gw1.fixtures).toHaveLength(2);
  });

  it('detects BGW: team with no fixtures in a GW', async () => {
    vi.mocked(fplFixturesCache.getOrFetchAllFixtures).mockResolvedValue([
      makeFixture(1, 2, 1, 2),
    ]);

    const result = await getFixturesCalendar();
    const team1Gw1 = result.byTeam[1].find((r) => r.gw === 1)!;
    expect(team1Gw1.fixtures).toHaveLength(0);
  });

  it('computes rest days between consecutive fixtures', async () => {
    vi.mocked(fplFixturesCache.getOrFetchAllFixtures).mockResolvedValue([
      makeFixture(1, 1, 1, 2, '2025-08-01T15:00:00Z'),
      makeFixture(2, 2, 1, 3, '2025-08-05T15:00:00Z'),
    ]);

    const result = await getFixturesCalendar();
    const gw1 = result.byTeam[1].find((r) => r.gw === 1)!.fixtures[0];
    const gw2 = result.byTeam[1].find((r) => r.gw === 2)!.fixtures[0];
    expect(gw1.restDaysBefore).toBe(7);
    expect(gw2.restDaysBefore).toBe(4);
  });

  it('returns opening rest days for GW1 fixture with no kickoffTime', async () => {
    vi.mocked(fplFixturesCache.getOrFetchAllFixtures).mockResolvedValue([
      makeFixture(1, 1, 1, 2, null),
    ]);

    const result = await getFixturesCalendar();
    const gw1 = result.byTeam[1].find((r) => r.gw === 1)!.fixtures[0];
    expect(gw1.restDaysBefore).toBe(7);
  });

  it('returns null restDaysBefore for later GW fixture with no kickoffTime', async () => {
    vi.mocked(fplFixturesCache.getOrFetchAllFixtures).mockResolvedValue([
      makeFixture(1, 2, 1, 2, null),
    ]);

    const result = await getFixturesCalendar();
    const gw2 = result.byTeam[1].find((r) => r.gw === 2)!.fixtures[0];
    expect(gw2.restDaysBefore).toBeNull();
  });

  it('returns opening rest days for first fixture of season', async () => {
    vi.mocked(fplFixturesCache.getOrFetchAllFixtures).mockResolvedValue([
      makeFixture(1, 1, 1, 2, '2025-08-01T15:00:00Z'),
    ]);

    const result = await getFixturesCalendar();
    const gw1 = result.byTeam[1].find((r) => r.gw === 1)!.fixtures[0];
    expect(gw1.restDaysBefore).toBe(7);
  });

  it('normalises strength into difficulty buckets 1–5 across 20 teams', async () => {
    vi.mocked(fplFixturesCache.getOrFetchAllFixtures).mockResolvedValue([
      makeFixture(1, 1, 1, 20),
    ]);

    const result = await getFixturesCalendar();
    const difficulties = new Set<number>();
    for (const teamId of Object.keys(result.byTeam).map(Number)) {
      for (const row of result.byTeam[teamId]) {
        for (const fix of row.fixtures) {
          difficulties.add(fix.overallDifficulty);
          difficulties.add(fix.defensiveDifficulty);
          difficulties.add(fix.attackingDifficulty);
        }
      }
    }
    for (const d of difficulties) {
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(5);
    }
  });

  it('returns teams sorted alphabetically', async () => {
    vi.mocked(fplFixturesCache.getOrFetchAllFixtures).mockResolvedValue([]);

    const result = await getFixturesCalendar();
    const names = result.teams.map((t) => t.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('returns 38 rows per team', async () => {
    vi.mocked(fplFixturesCache.getOrFetchAllFixtures).mockResolvedValue([]);

    const result = await getFixturesCalendar();
    for (const rows of Object.values(result.byTeam)) {
      expect(rows).toHaveLength(38);
    }
  });

  it('caches result with CALENDAR TTL', async () => {
    vi.mocked(fplFixturesCache.getOrFetchAllFixtures).mockResolvedValue([]);
    const setSpy = vi.spyOn(cacheLayer, 'set');

    await getFixturesCalendar();

    expect(setSpy).toHaveBeenCalledWith(
      'fixtures:calendar',
      expect.anything(),
      cacheLayer.ttl.CALENDAR
    );
  });

  it('returns cached result on second call', async () => {
    vi.mocked(fplFixturesCache.getOrFetchAllFixtures).mockResolvedValue([]);

    await getFixturesCalendar();
    await getFixturesCalendar();

    expect(fplFixturesCache.getOrFetchAllFixtures).toHaveBeenCalledTimes(1);
  });
});
