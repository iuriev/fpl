import * as cacheLayer from './cache';
import { db } from './db/client';
import * as fixturesService from './fixtures-service';
import { type FormationCounts, inferFormationForTeam } from './formation-inference';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
import { deriveSeason } from './fpl-cache/season';
import type { FPLBootstrapStatic, FPLElementSummary, FPLFixture } from './fpl-client';
import * as fplClient from './fpl-client';
import { getOrFetchElementSummary } from './fpl-element-summary-cache';
import { activeSquadElements } from './lineups-player-sets';
import {
  assignPlayersToSlots,
  getSlotLanes,
  type LaneAssignablePlayer,
} from './player-lane-registry';
import { loadPreviousSeasonFormationsByTeam } from './previous-season-formation';
import { resolveNextGw } from './resolve-next-gw';
import type {
  FixtureInfo,
  PlayerLane,
  PlayerPosition,
  PredictedLineupPlayer,
  PredictedLineupsResponse,
  PredictedTeamLineup,
} from './types';

const POSITION_MAP: Record<number, PlayerPosition> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

const SUMMARY_CONCURRENCY = 8;

async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function getAllFixturesCached(): Promise<FPLFixture[]> {
  const key = 'fixtures:all';
  const cached = cacheLayer.get<FPLFixture[]>(key);
  if (cached) return cached;
  const data = await fplClient.getFixturesAll();
  cacheLayer.set(key, data, cacheLayer.ttl.FIXTURES);
  return data;
}

function computeStartScore(
  el: FPLBootstrapStatic['elements'][number],
  summary: FPLElementSummary | undefined
): number {
  const rows = summary?.history ?? [];
  const recent = rows.slice(-8);
  const startsScore =
    recent.length === 0
      ? 0
      : recent.filter((r) => r.starts > 0).length / Math.min(5, recent.length);
  const minutesScore =
    recent.length === 0
      ? 0
      : recent.reduce((s, r) => s + r.minutes, 0) / recent.length / 90;
  const chance = el.chance_of_playing_next_round ?? el.chance_of_playing_this_round ?? 100;
  const chanceScore = chance / 100;
  let statusMult = 1;
  if (el.status === 'i' || el.status === 's' || el.status === 'u') statusMult = 0;
  else if (el.status === 'd') statusMult = 0.5;

  return (0.4 * startsScore + 0.3 * minutesScore + 0.3 * chanceScore) * statusMult;
}

function pickLine(
  candidates: Array<{
    el: FPLBootstrapStatic['elements'][number];
    startScore: number;
  }>,
  count: number
) {
  return [...candidates]
    .sort((a, b) => {
      if (b.startScore !== a.startScore) return b.startScore - a.startScore;
      return parseFloat(b.el.ep_next) - parseFloat(a.el.ep_next);
    })
    .slice(0, count);
}

function buildTeamLineup(
  teamId: number,
  bootstrap: FPLBootstrapStatic,
  summaries: Map<number, FPLElementSummary>,
  allFixtures: FPLFixture[],
  upcoming: Record<number, FixtureInfo[]>,
  targetGw: number,
  previousSeasonFormation: FormationCounts | null
): PredictedTeamLineup {
  const team = bootstrap.teams.find((t) => t.id === teamId)!;
  const getSummary = (id: number) => summaries.get(id);

  const formation = inferFormationForTeam(
    teamId,
    bootstrap,
    allFixtures,
    getSummary,
    previousSeasonFormation
  );

  const squad = activeSquadElements(bootstrap, teamId);
  const scored = squad.map((el) => ({
    el,
    startScore: computeStartScore(el, summaries.get(el.id)),
  }));

  const gkPick = pickLine(
    scored.filter((p) => p.el.element_type === 1),
    1
  );
  const defPick = pickLine(
    scored.filter((p) => p.el.element_type === 2),
    formation.counts.def
  );
  const midPick = pickLine(
    scored.filter((p) => p.el.element_type === 3),
    formation.counts.mid
  );
  const fwdPick = pickLine(
    scored.filter((p) => p.el.element_type === 4),
    formation.counts.fwd
  );

  const assignLine = (
    picks: typeof defPick,
    line: 'DEF' | 'MID' | 'FWD'
  ): PredictedLineupPlayer[] => {
    const slotLanes = getSlotLanes(line, picks.length);
    const assignable: LaneAssignablePlayer[] = picks.map((p) => ({
      id: p.el.id,
      code: p.el.code,
      startScore: p.startScore,
    }));
    const assigned = assignPlayersToSlots(assignable, slotLanes);
    return assigned.map((a) => {
      const el = picks.find((p) => p.el.id === a.id)!.el;
      const chance = el.chance_of_playing_next_round ?? el.chance_of_playing_this_round;
      const startScore = a.startScore;
      return {
        id: el.id,
        webName: el.web_name,
        position: POSITION_MAP[el.element_type] ?? 'MID',
        teamCode: el.team_code,
        lane: a.lane as PlayerLane,
        pitchOrder: a.pitchOrder,
        xMins: Math.round(Math.min(90, Math.max(0, startScore * 90))),
        xPts: parseFloat(el.ep_next) || 0,
        benchRisk:
          startScore < 0.6 ||
          el.status === 'd' ||
          (chance != null && chance < 75),
        chanceOfPlaying: chance,
        status: el.status,
      };
    });
  };

  const gkPlayers: PredictedLineupPlayer[] = gkPick.map((p, i) => {
    const chance = p.el.chance_of_playing_next_round ?? p.el.chance_of_playing_this_round;
    return {
      id: p.el.id,
      webName: p.el.web_name,
      position: 'GK',
      teamCode: p.el.team_code,
      lane: 'C',
      pitchOrder: i,
      xMins: Math.round(Math.min(90, Math.max(0, p.startScore * 90))),
      xPts: parseFloat(p.el.ep_next) || 0,
      benchRisk:
        p.startScore < 0.6 ||
        p.el.status === 'd' ||
        (chance != null && chance < 75),
      chanceOfPlaying: chance,
      status: p.el.status,
    };
  });

  const players = [
    ...gkPlayers,
    ...assignLine(defPick, 'DEF'),
    ...assignLine(midPick, 'MID'),
    ...assignLine(fwdPick, 'FWD'),
  ];

  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
  const fixtureRow = allFixtures.find(
    (f) =>
      f.event === targetGw &&
      !f.finished &&
      (f.team_h === teamId || f.team_a === teamId)
  );
  const upcomingRow = (upcoming[teamId] ?? []).find((f) => f.gw === targetGw);

  return {
    teamId: team.id,
    teamCode: team.code,
    shortName: team.short_name,
    formation,
    nextFixture:
      fixtureRow || upcomingRow
        ? {
            opponentShortName:
              upcomingRow?.opponent ??
              teamMap.get(
                fixtureRow!.team_h === teamId ? fixtureRow!.team_a : fixtureRow!.team_h
              ) ??
              '???',
            isHome: upcomingRow?.home ?? fixtureRow!.team_h === teamId,
            kickoffTime: fixtureRow?.kickoff_time ?? null,
          }
        : null,
    players,
  };
}

async function loadSummariesForTeams(
  bootstrap: FPLBootstrapStatic,
  teamIds: number[],
  season: string
): Promise<Map<number, FPLElementSummary>> {
  const ids = new Set<number>();
  for (const teamId of teamIds) {
    for (const el of activeSquadElements(bootstrap, teamId)) {
      ids.add(el.id);
    }
  }
  const idList = [...ids];
  const summaries = await mapConcurrent(idList, SUMMARY_CONCURRENCY, (id) =>
    getOrFetchElementSummary(db, season, id, 'interactive')
  );
  const map = new Map<number, FPLElementSummary>();
  idList.forEach((id, i) => map.set(id, summaries[i]));
  return map;
}

export async function getPredictedLineups(gwParam?: number): Promise<PredictedLineupsResponse> {
  const cacheKey = `predicted-lineups:${gwParam ?? 'next'}`;
  const cached = cacheLayer.get<PredictedLineupsResponse>(cacheKey);
  if (cached) return cached;

  const bootstrap = await getOrFetchBootstrap(db);
  const season = deriveSeason(bootstrap.events);
  const targetGw = gwParam ?? resolveNextGw(bootstrap);
  const [allFixtures, upcoming] = await Promise.all([
    getAllFixturesCached(),
    fixturesService.getUpcomingFixtures(),
  ]);

  const teamIds = bootstrap.teams.map((t) => t.id);
  const [summaries, previousSeasonFormations] = await Promise.all([
    loadSummariesForTeams(bootstrap, teamIds, season),
    loadPreviousSeasonFormationsByTeam(db, season),
  ]);

  const teams = teamIds.map((teamId) =>
    buildTeamLineup(
      teamId,
      bootstrap,
      summaries,
      allFixtures,
      upcoming,
      targetGw,
      previousSeasonFormations.get(teamId) ?? null
    )
  );

  const result: PredictedLineupsResponse = { gameweek: targetGw, teams };
  cacheLayer.set(cacheKey, result, cacheLayer.ttl.PREDICTED_LINEUPS);
  return result;
}
