export const MAX_GAMEWEEK = 38;

export interface Gameweek {
  id: number;
  name: string;
  finished: boolean;
}

export interface GameweeksResponse {
  current: number;
  gameweeks: Gameweek[];
}

export interface EntryResponse {
  teamId: number;
  teamName: string;
  managerName: string;
  overallPoints: number;
  overallRank: number;
  eventPoints: number;
  totalPlayers: number;
  regionIsoCode?: string;
}

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export type PlayerStatus = 'a' | 'd' | 'i' | 's' | 'u' | 'n';

export interface PlayerStats {
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  total_points: number;
}

export interface SquadPlayer {
  id: number;
  name: string;
  position: PlayerPosition;
  club: string;
  teamCode: number;
  points: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  status: PlayerStatus;
  chanceOfPlaying?: number | null;
  news?: string;
  stats: PlayerStats;
}

export interface SquadSummary {
  totalPoints: number;
  averagePoints?: number;
  highestPoints?: number;
  rank?: number;
  transfers: number;
}

export interface HistoryGameweek {
  gw: number;
  overallRank: number;
  overallPoints: number;
  gwRank: number;
  gwPoints: number;
  pointsOnBench: number;
  transfers: number;
  transferCost: number;
  teamValue: number;
}

export interface HistoryResponse {
  teamId: number;
  gameweeks: HistoryGameweek[];
}

export interface SquadResponse {
  gameweek: number;
  summary: SquadSummary;
  starters: SquadPlayer[];
  bench: SquadPlayer[];
}

export interface LeagueEntry {
  id: number;
  name: string;
  rank: number;
  lastRank: number | null;
}

export interface LeaguesResponse {
  teamId: number;
  classic: LeagueEntry[];
  h2h: LeagueEntry[];
}
