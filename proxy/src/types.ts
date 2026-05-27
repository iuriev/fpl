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
  teamId: number;
  nowCost: number;
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
  bank?: number;
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

export interface SquadResponse {
  gameweek: number;
  summary: SquadSummary;
  starters: SquadPlayer[];
  bench: SquadPlayer[];
}

export interface TopPlayer {
  id: number;
  webName: string;
  position: PlayerPosition;
  teamCode: number;
  teamShortName: string;
  points: number;
}

export interface TopPlayersGameweekResponse {
  gw: number;
  players: TopPlayer[];
}

export interface TopPlayersSeasonResponse {
  players: TopPlayer[];
}

export interface TeamInfo {
  id: number;
  code: number;
  name: string;
  shortName: string;
}

export interface TeamsResponse {
  teams: TeamInfo[];
}

export interface TeamPlayersResponse {
  teamCode: number;
  teamName: string;
  teamShortName: string;
  players: TopPlayer[];
}

export interface DreamTeamPlayer {
  id: number;
  webName: string;
  position: PlayerPosition;
  teamCode: number;
  teamShortName: string;
  points: number;
  pitchPosition: number;
}

export interface DreamTeamResponse {
  gw: number;
  players: DreamTeamPlayer[];
}

export interface FixtureInfo {
  gw: number;
  opponent: string;
  home: boolean;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface PoolPlayer {
  id: number;
  webName: string;
  firstName: string;
  lastName: string;
  team: number;
  teamCode: number;
  teamShortName: string;
  position: PlayerPosition;
  nowCost: number;
  totalPoints: number;
  eventPoints: number;
  status: PlayerStatus;
  chanceOfPlaying: number | null;
  news: string;
  selectedByPercent: string;
  expectedPoints: string;
  form: string;
  nextFixtures: FixtureInfo[];
}

export interface PlayerPoolResponse {
  players: PoolPlayer[];
}
