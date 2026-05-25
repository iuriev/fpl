/**
 * Squad service — composes squad data from FPL endpoints.
 * Handles all the complex mapping logic: players, positions, captain flags, availability, etc.
 */

import * as fplClient from './fpl-client';
import * as cacheLayer from './cache';
import type {
  SquadPlayer,
  SquadResponse,
  PlayerPosition,
  PlayerStatus,
} from './types';
import type { FPLBootstrapStatic, FPLPicks, FPLLive } from './fpl-client';

const POSITION_MAP: Record<number, PlayerPosition> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

async function getBootstrapWithCache(): Promise<FPLBootstrapStatic> {
  const cached = cacheLayer.get<FPLBootstrapStatic>('bootstrap-static');
  if (cached) return cached;

  const bootstrap = await fplClient.getBootstrapStatic();
  cacheLayer.set('bootstrap-static', bootstrap, cacheLayer.ttl.BOOTSTRAP);
  return bootstrap;
}

async function getPicksWithCache(
  teamId: number,
  gameweek: number,
  gameweekFinished: boolean,
): Promise<FPLPicks> {
  const cacheKey = `picks:${teamId}:${gameweek}`;
  const cached = cacheLayer.get<FPLPicks>(cacheKey);
  if (cached) return cached;

  const picks = await fplClient.getPicks(teamId, gameweek);
  const ttl = gameweekFinished ? cacheLayer.ttl.SQUAD_FINISHED : cacheLayer.ttl.SQUAD_CURRENT;
  cacheLayer.set(cacheKey, picks, ttl);
  return picks;
}

async function getLiveWithCache(gameweek: number): Promise<FPLLive> {
  const cacheKey = `live:${gameweek}`;
  const cached = cacheLayer.get<FPLLive>(cacheKey);
  if (cached) return cached;

  const live = await fplClient.getLive(gameweek);
  cacheLayer.set(cacheKey, live, cacheLayer.ttl.SQUAD_CURRENT);
  return live;
}

export async function getSquad(teamId: number, gameweek: number): Promise<SquadResponse> {
  const bootstrap = await getBootstrapWithCache();
  const gameweekEvent = bootstrap.events.find((e) => e.id === gameweek);
  if (!gameweekEvent) throw new Error(`Gameweek ${gameweek} not found`);

  let picks;
  try {
    picks = await getPicksWithCache(teamId, gameweek, gameweekEvent.finished);
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      const err = new Error(`No picks available for gameweek ${gameweek}`);
      (err as unknown as { cause: Error }).cause = error;
      throw err;
    }
    throw error;
  }

  const live = await getLiveWithCache(gameweek);

  // Build lookup maps for quick access
  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
  const playerMap = new Map(bootstrap.elements.map((e) => [e.id, e]));
  const liveMap = new Map(live.elements.map((e) => [e.id, e.stats]));
  const pickPositionMap = new Map(picks.picks.map((p) => [p.element, p.position]));

  // Build players array
  const players = picks.picks.map((pick) => {
    const playerData = playerMap.get(pick.element);
    if (!playerData) throw new Error(`Player ${pick.element} not found`);

    const teamName = teamMap.get(playerData.team) || 'Unknown';
    const liveStats = liveMap.get(pick.element);
    const stats = {
      total_points: liveStats?.total_points ?? 0,
      minutes: liveStats?.minutes ?? 0,
      goals_scored: liveStats?.goals_scored ?? 0,
      assists: liveStats?.assists ?? 0,
      clean_sheets: liveStats?.clean_sheets ?? 0,
      goals_conceded: liveStats?.goals_conceded ?? 0,
      own_goals: liveStats?.own_goals ?? 0,
      penalties_saved: liveStats?.penalties_saved ?? 0,
      penalties_missed: liveStats?.penalties_missed ?? 0,
      yellow_cards: liveStats?.yellow_cards ?? 0,
      red_cards: liveStats?.red_cards ?? 0,
      saves: liveStats?.saves ?? 0,
      bonus: liveStats?.bonus ?? 0,
    };

    return {
      id: pick.element,
      name: playerData.web_name,
      position: POSITION_MAP[playerData.element_type] || 'GK',
      club: teamName,
      teamCode: playerData.team_code,
      teamId: playerData.team,
      nowCost: playerData.now_cost,
      points: stats.total_points,
      isCaptain: pick.is_captain,
      isViceCaptain: pick.is_vice_captain,
      status: playerData.status as PlayerStatus,
      chanceOfPlaying: playerData.chance_of_playing_this_round,
      news: playerData.news || undefined,
      stats,
    } as SquadPlayer;
  });

  // Split into starters (positions 1-11) and bench (positions 12-15)
  const starters = players
    .filter((p) => {
      const pos = pickPositionMap.get(p.id);
      return pos !== undefined && pos <= 11;
    })
    .sort((a, b) => {
      const posA = pickPositionMap.get(a.id) ?? 0;
      const posB = pickPositionMap.get(b.id) ?? 0;
      return posA - posB;
    });

  const bench = players
    .filter((p) => {
      const pos = pickPositionMap.get(p.id);
      return pos !== undefined && pos > 11;
    })
    .sort((a, b) => {
      const posA = pickPositionMap.get(a.id) ?? 0;
      const posB = pickPositionMap.get(b.id) ?? 0;
      return posA - posB;
    });

  // Build summary
  const entryHistory = picks.entry_history;
  const totalPoints = Math.max(0, entryHistory.points - entryHistory.event_transfers_cost);

  return {
    gameweek,
    summary: {
      totalPoints,
      averagePoints: gameweekEvent.average_entry_score,
      highestPoints: gameweekEvent.highest_score,
      rank: entryHistory.rank,
      transfers: entryHistory.event_transfers,
      bank: entryHistory.bank,
    },
    starters,
    bench,
  };
}
