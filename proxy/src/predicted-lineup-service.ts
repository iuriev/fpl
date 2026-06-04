import * as cacheLayer from './cache';
import { db } from './db/client';
import * as fixturesService from './fixtures-service';
import { type FormationCounts, inferFormationForTeam } from './formation-inference';
import { getOrFetchBootstrap } from './fpl-cache/db-cache';
import { deriveSeason } from './fpl-cache/season';
import type { FPLBootstrapStatic, FPLElementSummary, FPLFixture } from './fpl-client';
import { getCachedElementSummary } from './fpl-element-summary-cache';
import { getOrFetchAllFixtures } from './fpl-fixtures-cache';
import {
  hasInjuryWarning,
  isExcludedFromPredictedLineup,
} from './lineup-availability';
import { pickLine, pickLineWithRoleQuotas } from './lineup-selection';
import type { LineGroup } from './lineup-slot-requirements';
import { getRoleQuotasForLine } from './lineup-slot-requirements';
import { activeSquadElements } from './lineups-player-sets';
import { LineupsWarmingError } from './lineups-warming-error';
import { getLineupsWarmupStatus } from './lineups-warmup';
import { assignPlayersToSlots, type LaneAssignablePlayer } from './player-lane-registry';
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

const ELEMENT_LINE: Record<number, LineGroup> = {
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

function pickOutfieldLine(
  scored: Array<{ el: FPLBootstrapStatic['elements'][number]; startScore: number }>,
  elementType: number,
  count: number,
  kickoffTime: string | null
) {
  const eligible = scored.filter(
    (p) =>
      p.el.element_type === elementType &&
      !isExcludedFromPredictedLineup(p.el, kickoffTime)
  );
  const line = ELEMENT_LINE[elementType];
  const quotas = line ? getRoleQuotasForLine(line, count) : null;
  if (quotas && line) {
    return pickLineWithRoleQuotas(eligible, count, quotas, line);
  }
  return pickLine(eligible, count);
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

  const fixtureRow = allFixtures.find(
    (f) =>
      f.event === targetGw &&
      !f.finished &&
      (f.team_h === teamId || f.team_a === teamId)
  );
  const upcomingRow = (upcoming[teamId] ?? []).find((f) => f.gw === targetGw);
  const kickoffTime = fixtureRow?.kickoff_time ?? null;

  const gkPick = pickLine(
    scored.filter(
      (p) => p.el.element_type === 1 && !isExcludedFromPredictedLineup(p.el, kickoffTime)
    ),
    1
  );
  const defPick = pickOutfieldLine(scored, 2, formation.counts.def, kickoffTime);
  const midPick = pickOutfieldLine(scored, 3, formation.counts.mid, kickoffTime);
  const fwdPick = pickOutfieldLine(scored, 4, formation.counts.fwd, kickoffTime);

  const playerFlags = (el: FPLBootstrapStatic['elements'][number], startScore: number) => {
    const chance = el.chance_of_playing_next_round ?? el.chance_of_playing_this_round;
    return {
      benchRisk:
        startScore < 0.6 ||
        el.status === 'd' ||
        (chance != null && chance < 75),
      injuryWarning: hasInjuryWarning(el, kickoffTime),
      chanceOfPlaying: chance,
      status: el.status,
    };
  };

  const assignLine = (
    picks: typeof defPick,
    line: 'DEF' | 'MID' | 'FWD'
  ): PredictedLineupPlayer[] => {
    const assignable: LaneAssignablePlayer[] = picks.map((p) => ({
      id: p.el.id,
      code: p.el.code,
      startScore: p.startScore,
    }));
    const assigned = assignPlayersToSlots(assignable, line, picks.length);
    return assigned.map((a) => {
      const el = picks.find((p) => p.el.id === a.id)!.el;
      const startScore = a.startScore;
      const flags = playerFlags(el, startScore);
      return {
        id: el.id,
        webName: el.web_name,
        position: POSITION_MAP[el.element_type] ?? 'MID',
        teamCode: el.team_code,
        lane: a.lane as PlayerLane,
        pitchOrder: a.pitchOrder,
        xMins: Math.round(Math.min(90, Math.max(0, startScore * 90))),
        xPts: parseFloat(el.ep_next) || 0,
        benchRisk: flags.benchRisk,
        injuryWarning: flags.injuryWarning,
        chanceOfPlaying: flags.chanceOfPlaying,
        status: flags.status,
      };
    });
  };

  const gkPlayers: PredictedLineupPlayer[] = gkPick.map((p, i) => {
    const flags = playerFlags(p.el, p.startScore);
    return {
      id: p.el.id,
      webName: p.el.web_name,
      position: 'GK',
      teamCode: p.el.team_code,
      lane: 'C',
      pitchOrder: i,
      xMins: Math.round(Math.min(90, Math.max(0, p.startScore * 90))),
      xPts: parseFloat(p.el.ep_next) || 0,
      benchRisk: flags.benchRisk,
      injuryWarning: flags.injuryWarning,
      chanceOfPlaying: flags.chanceOfPlaying,
      status: flags.status,
    };
  });

  const players = [
    ...gkPlayers,
    ...assignLine(defPick, 'DEF'),
    ...assignLine(midPick, 'MID'),
    ...assignLine(fwdPick, 'FWD'),
  ];

  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));

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
  const map = new Map<number, FPLElementSummary>();
  for (const id of ids) {
    const summary = await getCachedElementSummary(db, season, id);
    if (summary) map.set(id, summary);
  }
  return map;
}

export async function getPredictedLineups(
  gwParam?: number,
  opts?: { skipReadyGuard?: boolean }
): Promise<PredictedLineupsResponse> {
  const cacheKey = `predicted-lineups:${gwParam ?? 'next'}`;
  const cached = cacheLayer.get<PredictedLineupsResponse>(cacheKey);
  if (cached) return cached;

  if (!opts?.skipReadyGuard && !getLineupsWarmupStatus().ready) {
    throw new LineupsWarmingError();
  }

  const buildStarted = Date.now();
  const bootstrap = await getOrFetchBootstrap(db);
  const season = deriveSeason(bootstrap.events);
  const targetGw = gwParam ?? resolveNextGw(bootstrap);
  console.log(
    `[predicted-lineups] building cache gw=${targetGw} season=${season}${opts?.skipReadyGuard ? ' (warmup)' : ''}`
  );

  const [allFixtures, upcoming] = await Promise.all([
    getOrFetchAllFixtures(db),
    fixturesService.getUpcomingFixtures(),
  ]);

  const teamIds = bootstrap.teams.map((t) => t.id);
  const [summaries, previousSeasonFormations] = await Promise.all([
    loadSummariesForTeams(bootstrap, teamIds, season),
    loadPreviousSeasonFormationsByTeam(db, season),
  ]);

  console.log(
    `[predicted-lineups] loaded ${summaries.size} element summaries for ${teamIds.length} teams`
  );

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
  console.log(
    `[predicted-lineups] cache stored gw=${targetGw} in ${Date.now() - buildStarted}ms`
  );
  return result;
}
