import * as cacheLayer from './cache';
import { db } from './db/client';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
import type { FPLFixture } from './fpl-client';
import * as fplClient from './fpl-client';
import { MAX_GAMEWEEK } from './types';

export interface CalendarTeam {
  id: number;
  code: number;
  name: string;
  shortName: string;
  strengthOverallHome: number;
  strengthOverallAway: number;
  strengthAttackHome: number;
  strengthAttackAway: number;
  strengthDefenceHome: number;
  strengthDefenceAway: number;
}

export interface CalendarGameweek {
  id: number;
  name: string;
  finished: boolean;
  isCurrent: boolean;
  deadline: string;
}

export interface CalendarFixture {
  opponentShortName: string;
  opponentId: number;
  home: boolean;
  officialDifficulty: 1 | 2 | 3 | 4 | 5;
  overallDifficulty: 1 | 2 | 3 | 4 | 5;
  defensiveDifficulty: 1 | 2 | 3 | 4 | 5;
  attackingDifficulty: 1 | 2 | 3 | 4 | 5;
  kickoffTime: string | null;
  restDaysBefore: number | null;
}

export interface TeamGwRow {
  gw: number;
  fixtures: CalendarFixture[];
}

export interface CalendarResponse {
  teams: CalendarTeam[];
  gameweeks: CalendarGameweek[];
  byTeam: Record<number, TeamGwRow[]>;
}

type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

function rankToDifficulty(rank: number): DifficultyLevel {
  if (rank <= 4) return 1;
  if (rank <= 8) return 2;
  if (rank <= 12) return 3;
  if (rank <= 16) return 4;
  return 5;
}

type StrengthKey =
  | 'strength_overall_home'
  | 'strength_overall_away'
  | 'strength_attack_home'
  | 'strength_attack_away'
  | 'strength_defence_home'
  | 'strength_defence_away';

function buildStrengthRankMap(
  teams: Array<{ id: number } & Record<StrengthKey, number>>,
  homeKey: StrengthKey,
  awayKey: StrengthKey
): Map<number, { home: DifficultyLevel; away: DifficultyLevel }> {
  const sortedHome = [...teams].sort((a, b) => a[homeKey] - b[homeKey]);
  const sortedAway = [...teams].sort((a, b) => a[awayKey] - b[awayKey]);

  const homeRank = new Map(sortedHome.map((t, i) => [t.id, i + 1]));
  const awayRank = new Map(sortedAway.map((t, i) => [t.id, i + 1]));

  const result = new Map<number, { home: DifficultyLevel; away: DifficultyLevel }>();
  for (const team of teams) {
    result.set(team.id, {
      home: rankToDifficulty(homeRank.get(team.id)!),
      away: rankToDifficulty(awayRank.get(team.id)!),
    });
  }
  return result;
}

function computeRestDays(fixtures: Array<{ kickoffTime: string | null }>): (number | null)[] {
  const withTime = fixtures.filter((f) => f.kickoffTime !== null) as Array<{
    kickoffTime: string;
  }>;
  const sorted = [...withTime].sort(
    (a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime()
  );
  const restMap = new Map<string, number | null>();
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      restMap.set(sorted[i].kickoffTime, null);
    } else {
      const ms =
        new Date(sorted[i].kickoffTime).getTime() -
        new Date(sorted[i - 1].kickoffTime).getTime();
      restMap.set(sorted[i].kickoffTime, Math.floor(ms / 86400000));
    }
  }
  return fixtures.map((f) => (f.kickoffTime ? (restMap.get(f.kickoffTime) ?? null) : null));
}

export async function getFixturesCalendar(): Promise<CalendarResponse> {
  const cacheKey = 'fixtures:calendar';
  const cached = cacheLayer.get<CalendarResponse>(cacheKey);
  if (cached) return cached;

  const [bootstrap, allFixtures] = await Promise.all([
    getOrFetchBootstrap(db),
    fplClient.getFixturesAll(),
  ]);

  const teamMap = new Map(
    bootstrap.teams.map((t) => [
      t.id,
      {
        id: t.id,
        code: t.code,
        name: t.name,
        shortName: t.short_name,
        strengthOverallHome: t.strength_overall_home,
        strengthOverallAway: t.strength_overall_away,
        strengthAttackHome: t.strength_attack_home,
        strengthAttackAway: t.strength_attack_away,
        strengthDefenceHome: t.strength_defence_home,
        strengthDefenceAway: t.strength_defence_away,
      } satisfies CalendarTeam,
    ])
  );

  const teams = bootstrap.teams
    .map((t) => teamMap.get(t.id)!)
    .sort((a, b) => a.name.localeCompare(b.name));

  const gameweeks: CalendarGameweek[] = bootstrap.events
    .filter((e) => e.id <= MAX_GAMEWEEK)
    .map((e) => ({
      id: e.id,
      name: e.name,
      finished: e.finished,
      isCurrent: e.is_current,
      deadline: e.deadline_time,
    }));

  const overallRank = buildStrengthRankMap(
    bootstrap.teams as Array<{ id: number } & Record<StrengthKey, number>>,
    'strength_overall_home',
    'strength_overall_away'
  );
  const attackRank = buildStrengthRankMap(
    bootstrap.teams as Array<{ id: number } & Record<StrengthKey, number>>,
    'strength_attack_home',
    'strength_attack_away'
  );
  const defenceRank = buildStrengthRankMap(
    bootstrap.teams as Array<{ id: number } & Record<StrengthKey, number>>,
    'strength_defence_home',
    'strength_defence_away'
  );

  // Build per-team flat fixture list (sorted by kickoff) for rest day calculation
  const teamFixtureList = new Map<number, Array<FPLFixture & { isHome: boolean }>>();
  for (const teamId of teamMap.keys()) {
    teamFixtureList.set(teamId, []);
  }
  for (const fixture of allFixtures) {
    if (fixture.event === null || fixture.event > MAX_GAMEWEEK) continue;
    teamFixtureList.get(fixture.team_h)?.push({ ...fixture, isHome: true });
    teamFixtureList.get(fixture.team_a)?.push({ ...fixture, isHome: false });
  }

  // Build byTeam: per-team, per-GW rows
  const byTeam: Record<number, TeamGwRow[]> = {};

  for (const [teamId, teamFixtures] of teamFixtureList) {
    const sortedTeamFixtures = [...teamFixtures].sort((a, b) => {
      if (!a.kickoff_time && !b.kickoff_time) return 0;
      if (!a.kickoff_time) return 1;
      if (!b.kickoff_time) return -1;
      return new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime();
    });

    const restDays = computeRestDays(
      sortedTeamFixtures.map((f) => ({ kickoffTime: f.kickoff_time }))
    );
    const restDaysByFixtureId = new Map(
      sortedTeamFixtures.map((f, i) => [f.id, restDays[i]])
    );

    // Group by GW
    const byGw = new Map<number, CalendarFixture[]>();
    for (const fixture of teamFixtures) {
      if (fixture.event === null || fixture.event > MAX_GAMEWEEK) continue;
      const gw = fixture.event;
      if (!byGw.has(gw)) byGw.set(gw, []);

      const opponentId = fixture.isHome ? fixture.team_a : fixture.team_h;
      const opponent = teamMap.get(opponentId);
      const opponentTeam = bootstrap.teams.find((t) => t.id === opponentId);

      const opponentOverall = overallRank.get(opponentId)!;
      const opponentAttack = attackRank.get(opponentId)!;
      const opponentDefence = defenceRank.get(opponentId)!;

      // Difficulty from opponent's perspective for each tab:
      // Overall: opponent's overall strength (home/away based on where opponent plays)
      // Defensive: opponent's attack strength (they attack you → defensive difficulty)
      // Attacking: opponent's defence strength (you attack them → attacking difficulty)
      const opponentPlaysAtHome = !fixture.isHome; // opponent plays at home when our team is away
      const overallDiff = opponentPlaysAtHome
        ? opponentOverall.home
        : opponentOverall.away;
      const defensiveDiff = opponentPlaysAtHome
        ? opponentAttack.home
        : opponentAttack.away;
      const attackingDiff = opponentPlaysAtHome
        ? opponentDefence.home
        : opponentDefence.away;

      byGw.get(gw)!.push({
        opponentShortName: opponent?.shortName ?? opponentTeam?.short_name ?? '???',
        opponentId,
        home: fixture.isHome,
        officialDifficulty: (fixture.isHome
          ? fixture.team_h_difficulty
          : fixture.team_a_difficulty) as DifficultyLevel,
        overallDifficulty: overallDiff,
        defensiveDifficulty: defensiveDiff,
        attackingDifficulty: attackingDiff,
        kickoffTime: fixture.kickoff_time,
        restDaysBefore: restDaysByFixtureId.get(fixture.id) ?? null,
      });
    }

    // Build sorted rows for all 38 GWs
    const rows: TeamGwRow[] = gameweeks.map((gw) => ({
      gw: gw.id,
      fixtures: byGw.get(gw.id) ?? [],
    }));

    byTeam[teamId] = rows;
  }

  const result: CalendarResponse = { teams, gameweeks, byTeam };
  cacheLayer.set(cacheKey, result, cacheLayer.ttl.CALENDAR);
  return result;
}
