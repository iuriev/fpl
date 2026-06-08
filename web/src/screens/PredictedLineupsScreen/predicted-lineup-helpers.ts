import type { PlayerPosition, PredictedLineupPlayer, SquadPlayer } from '@/types';

import { displayPredictedXMins } from './predicted-lineup-display';

const EMPTY_STATS = {
  minutes: 0,
  goals_scored: 0,
  assists: 0,
  clean_sheets: 0,
  goals_conceded: 0,
  own_goals: 0,
  penalties_saved: 0,
  penalties_missed: 0,
  yellow_cards: 0,
  red_cards: 0,
  saves: 0,
  bonus: 0,
  total_points: 0,
};

export function toSquadPlayer(
  player: PredictedLineupPlayer,
  club: string,
  teamId: number
): SquadPlayer {
  return {
    id: player.id,
    fplCode: player.fplCode,
    name: player.webName,
    position: player.position,
    club,
    teamCode: player.teamCode,
    teamId,
    nowCost: 0,
    points: 0,
    isCaptain: false,
    isViceCaptain: false,
    status: player.status,
    chanceOfPlaying: player.chanceOfPlaying,
    stats: {
      ...EMPTY_STATS,
      minutes: displayPredictedXMins(player.xMins),
      total_points: player.xPts,
    },
    isWatchlisted: false,
  };
}

export function groupByPosition(players: PredictedLineupPlayer[]): Record<PlayerPosition, PredictedLineupPlayer[]> {
  const groups: Record<PlayerPosition, PredictedLineupPlayer[]> = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  };
  for (const p of players) {
    groups[p.position].push(p);
  }
  for (const pos of Object.keys(groups) as PlayerPosition[]) {
    groups[pos].sort((a, b) => a.pitchOrder - b.pitchOrder);
  }
  return groups;
}

export const POSITION_ORDER: PlayerPosition[] = ['FWD', 'MID', 'DEF', 'GK'];
