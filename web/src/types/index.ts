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
}

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export type PlayerStatus = 'a' | 'd' | 'i' | 's' | 'u' | 'n';

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
}

export interface SquadSummary {
  totalPoints: number;
  averagePoints?: number;
  highestPoints?: number;
  rank?: number;
  transfers: number;
}

export interface SquadResponse {
  gameweek: number;
  summary: SquadSummary;
  starters: SquadPlayer[];
  bench: SquadPlayer[];
}
