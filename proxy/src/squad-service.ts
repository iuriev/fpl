import { db } from './db/client';
import { getOrFetchBootstrap, getOrFetchGwLive, getOrFetchHistory, getOrFetchSquad, getSeasonMeta } from './fpl-cache/db-cache';
import { deriveSeason } from './fpl-cache/season';
import type {
  FPLBootstrapStatic,
  FPLHistory,
  FPLHistoryChip,
  FPLLive,
} from './fpl-client';
import type {
  ActiveChip,
  ChipInfo,
  ChipStatuses,
  PlayerPosition,
  PlayerStatus,
  SquadPlayer,
  SquadResponse,
  StatEntry,
} from './types';

const HIDDEN_STAT_IDENTIFIERS = new Set(['goals_conceded', 'bps']);

function buildStatBreakdown(explain: FPLLive['elements'][0]['explain']): StatEntry[] {
  const map = new Map<string, StatEntry>();
  for (const fixture of explain) {
    for (const stat of fixture.stats) {
      if (stat.value === 0 || HIDDEN_STAT_IDENTIFIERS.has(stat.identifier)) continue;
      const existing = map.get(stat.identifier);
      if (existing) {
        existing.value += stat.value;
        existing.points += stat.points;
      } else {
        map.set(stat.identifier, {
          identifier: stat.identifier,
          value: stat.value,
          points: stat.points,
        });
      }
    }
  }
  return Array.from(map.values());
}

const POSITION_MAP: Record<number, PlayerPosition> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

const KNOWN_CHIPS = new Set<ActiveChip>(['wildcard', '3xc', 'freehit', 'bboost']);

function toActiveChip(raw: string | null): ActiveChip {
  if (raw !== null && KNOWN_CHIPS.has(raw as ActiveChip)) return raw as ActiveChip;
  return null;
}

export function computeFreeTransfers(history: FPLHistory['current']): number {
  let ft = 1;
  for (const gw of history) {
    ft = Math.min(2, Math.max(0, ft - gw.event_transfers) + 1);
  }
  return ft;
}

export function computeChipStatuses(
  activeChip: ActiveChip,
  playedChips: FPLHistoryChip[],
  bootstrapChips: FPLBootstrapStatic['chips'],
  currentGw: number,
): ChipStatuses {
  const chips = playedChips ?? [];
  const windows = bootstrapChips ?? [];
  const played = (name: string) => chips.filter((c) => c.name === name);

  const wcWindows = windows.filter((c) => c.name === 'wildcard');
  const currentWindow = wcWindows.find(
    (w) => currentGw >= w.start_event && currentGw <= w.stop_event,
  );
  const wcPlayInWindow = currentWindow
    ? played('wildcard').find(
        (c) => c.event >= currentWindow.start_event && c.event <= currentWindow.stop_event,
      )
    : undefined;

  function chipInfo(name: string, windowOverride?: { used: boolean; event?: number }): ChipInfo {
    if (activeChip === name) return { status: 'active' };
    if (windowOverride !== undefined) {
      return windowOverride.used
        ? { status: 'used', usedInGw: windowOverride.event }
        : { status: 'available' };
    }
    const plays = played(name);
    if (plays.length > 0) return { status: 'used', usedInGw: plays[plays.length - 1].event };
    return { status: 'available' };
  }

  return {
    wildcard: chipInfo('wildcard', { used: !!wcPlayInWindow, event: wcPlayInWindow?.event }),
    freehit: chipInfo('freehit'),
    bboost: chipInfo('bboost'),
    '3xc': chipInfo('3xc'),
  };
}

export async function getSquad(teamId: number, gameweek: number): Promise<SquadResponse> {
  const bootstrap = await getOrFetchBootstrap(db);
  const season = deriveSeason(bootstrap.events);
  const { isComplete } = await getSeasonMeta(db, season);

  const gameweekEvent = bootstrap.events.find((e) => e.id === gameweek);
  if (!gameweekEvent) throw new Error(`Gameweek ${gameweek} not found`);

  let picks;
  try {
    picks = await getOrFetchSquad(db, season, teamId, gameweek, bootstrap.events);
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      const err = new Error(`No picks available for gameweek ${gameweek}`);
      (err as unknown as { cause: Error }).cause = error;
      throw err;
    }
    throw error;
  }

  const [live, history] = await Promise.all([
    getOrFetchGwLive(db, season, gameweek, bootstrap.events),
    getOrFetchHistory(db, season, teamId, bootstrap.events, isComplete),
  ]);

  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
  const playerMap = new Map(bootstrap.elements.map((e) => [e.id, e]));
  const liveMap = new Map(live.elements.map((e) => [e.id, e]));
  const pickPositionMap = new Map(picks.picks.map((p) => [p.element, p.position]));

  const players = picks.picks.map((pick) => {
    const playerData = playerMap.get(pick.element);
    if (!playerData) throw new Error(`Player ${pick.element} not found`);

    const teamName = teamMap.get(playerData.team) || 'Unknown';
    const liveElement = liveMap.get(pick.element);
    const liveStats = liveElement?.stats;
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

    const statBreakdown = liveElement?.explain
      ? buildStatBreakdown(liveElement.explain)
      : undefined;

    return {
      id: pick.element,
      fplCode: playerData.code,
      name: playerData.web_name,
      position: POSITION_MAP[playerData.element_type] || 'GK',
      club: teamName,
      teamCode: playerData.team_code,
      teamId: playerData.team,
      nowCost: playerData.now_cost,
      sellPrice: pick.selling_price,
      points: stats.total_points,
      isCaptain: pick.is_captain,
      isViceCaptain: pick.is_vice_captain,
      status: playerData.status as PlayerStatus,
      chanceOfPlaying: playerData.chance_of_playing_this_round,
      news: playerData.news || undefined,
      stats,
      statBreakdown,
      isWatchlisted: false,
    } as SquadPlayer;
  });

  const starters = players
    .filter((p) => {
      const pos = pickPositionMap.get(p.id);
      return pos !== undefined && pos <= 11;
    })
    .sort((a, b) => (pickPositionMap.get(a.id) ?? 0) - (pickPositionMap.get(b.id) ?? 0));

  const bench = players
    .filter((p) => {
      const pos = pickPositionMap.get(p.id);
      return pos !== undefined && pos > 11;
    })
    .sort((a, b) => (pickPositionMap.get(a.id) ?? 0) - (pickPositionMap.get(b.id) ?? 0));

  const entryHistory = picks.entry_history;
  const totalPoints = Math.max(0, entryHistory.points - entryHistory.event_transfers_cost);
  const activeChip = toActiveChip(picks.active_chip);

  return {
    gameweek,
    activeChip,
    chipStatuses: computeChipStatuses(activeChip, history.chips, bootstrap.chips, gameweek),
    summary: {
      totalPoints,
      averagePoints: gameweekEvent.average_entry_score,
      highestPoints: gameweekEvent.highest_score,
      rank: entryHistory.rank,
      transfers: entryHistory.event_transfers,
      bank: entryHistory.bank,
      freeTransfers: Math.max(
        0,
        computeFreeTransfers(history.current) - entryHistory.event_transfers,
      ),
    },
    starters,
    bench,
  };
}
