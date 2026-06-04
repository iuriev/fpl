import * as cacheLayer from './cache';
import { db } from './db/client';
import * as fixturesService from './fixtures-service';
import { type FormationCounts, inferFormationForTeam } from './formation-inference';
import {
  adjustFormationForSquad,
  countEligibleByLine,
} from './formation-squad-fit';
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

  const inferredFormation = inferFormationForTeam(
    teamId,
    bootstrap,
    allFixtures,
    getSummary,
    previousSeasonFormation
  );
  const formation = adjustFormationForSquad(
    inferredFormation,
    countEligibleByLine(squad, kickoffTime)
  );

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

const SUMMARY_LOAD_LOG_EVERY = 50;

async function loadSummariesForTeams(
  bootstrap: FPLBootstrapStatic,
  teamIds: number[],
  season: string
): Promise<Map<number, FPLElementSummary>> {
  const ids = [...new Set(
    teamIds.flatMap((teamId) =>
      activeSquadElements(bootstrap, teamId).map((el) => el.id)
    )
  )];
  logPredictedLineups(`loading ${ids.length} element summaries from cache (DB per player)`);
  const started = Date.now();
  const map = new Map<number, FPLElementSummary>();
  let loaded = 0;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]!;
    const summary = await getCachedElementSummary(db, season, id);
    if (summary) {
      map.set(id, summary);
      loaded++;
    }
    const done = i + 1;
    if (done === ids.length || done % SUMMARY_LOAD_LOG_EVERY === 0) {
      logPredictedLineups(
        `summaries ${done}/${ids.length} checked, ${loaded} hit (${Date.now() - started}ms)`
      );
    }
  }
  return map;
}

function logPredictedLineups(message: string): void {
  console.log(`[predicted-lineups] ${message}`);
}

export async function getPredictedLineups(
  gwParam?: number,
  opts?: { skipReadyGuard?: boolean; refreshCache?: boolean }
): Promise<PredictedLineupsResponse> {
  const cacheKey = `predicted-lineups:${gwParam ?? 'next'}`;
  if (opts?.refreshCache) {
    cacheLayer.remove(cacheKey);
  }
  const cached = cacheLayer.get<PredictedLineupsResponse>(cacheKey);
  if (cached) {
    logPredictedLineups(`cache hit gw=${cached.gameweek} key=${cacheKey}`);
    return cached;
  }

  if (!opts?.skipReadyGuard && !getLineupsWarmupStatus().ready) {
    throw new LineupsWarmingError();
  }

  const buildStarted = Date.now();
  const bootstrap = await getOrFetchBootstrap(db);
  const season = deriveSeason(bootstrap.events);
  const targetGw = gwParam ?? resolveNextGw(bootstrap);
  const warmupTag = opts?.skipReadyGuard
    ? opts.refreshCache
      ? ' (warmup full)'
      : ' (warmup hot)'
    : '';
  logPredictedLineups(`building cache gw=${targetGw} season=${season}${warmupTag}`);

  const fixturesStarted = Date.now();
  logPredictedLineups('fetching all fixtures and upcoming fixture map');
  const [allFixtures, upcoming] = await Promise.all([
    getOrFetchAllFixtures(db),
    fixturesService.getUpcomingFixtures(),
  ]);
  logPredictedLineups(
    `fixtures ready: ${allFixtures.length} rows, ${Object.keys(upcoming).length} teams with upcoming (${Date.now() - fixturesStarted}ms)`
  );

  const teamIds = bootstrap.teams.map((t) => t.id);
  const depsStarted = Date.now();
  logPredictedLineups(
    `loading summaries + previous-season formations for ${teamIds.length} teams`
  );
  const [summaries, previousSeasonFormations] = await Promise.all([
    loadSummariesForTeams(bootstrap, teamIds, season),
    loadPreviousSeasonFormationsByTeam(db, season).then((formations) => {
      logPredictedLineups(
        `previous-season formations: ${formations.size} teams (${Date.now() - depsStarted}ms)`
      );
      return formations;
    }),
  ]);

  logPredictedLineups(
    `dependencies ready: ${summaries.size} summaries, ${previousSeasonFormations.size} prior formations (${Date.now() - depsStarted}ms)`
  );

  const lineupsStarted = Date.now();
  logPredictedLineups(`building ${teamIds.length} team lineups`);
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
  logPredictedLineups(`team lineups built in ${Date.now() - lineupsStarted}ms`);

  const result: PredictedLineupsResponse = { gameweek: targetGw, teams };
  cacheLayer.set(cacheKey, result, cacheLayer.ttl.PREDICTED_LINEUPS);
  logPredictedLineups(`cache stored gw=${targetGw} in ${Date.now() - buildStarted}ms`);
  return result;
}
