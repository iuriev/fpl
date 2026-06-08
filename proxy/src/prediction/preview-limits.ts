import type { PlayerPosition } from '../types';

export const PREVIEW_PLAYER_LIMIT = 2;
export const PREVIEW_TEAM_LIMIT = 2;

export const ELEMENT_TYPE_TO_POSITION: Record<number, PlayerPosition> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

export const ASSIST_PREVIEW_POSITIONS: PlayerPosition[] = ['FWD', 'MID', 'DEF'];

export const POINTS_PREVIEW_POSITIONS: PlayerPosition[] = ['FWD', 'MID', 'DEF', 'GK'];
