import type { PlayerLane } from '../player-lane-registry';
import type { TacticalRole } from '../player-tactical-role';
export type { SetpieceRole } from './scrape-transfermarkt-setpiece';

export interface TacticalProfileDraft {
  role: TacticalRole;
  lane: PlayerLane;
  secondary: TacticalRole[];
}

const TM_TO_ROLE: Record<string, TacticalRole> = {
  goalkeeper: 'gk',
  'centre-back': 'cb',
  'left-back': 'lb',
  'right-back': 'rb',
  'defensive midfield': 'dm',
  'central midfield': 'cm',
  'attacking midfield': 'am',
  'left midfield': 'lm',
  'right midfield': 'rm',
  'left winger': 'lw',
  'right winger': 'rw',
  'centre-forward': 'st',
  'second striker': 'st',
};

export function normalizeTransfermarktPosition(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function laneForTacticalRole(role: TacticalRole): PlayerLane {
  if (role === 'lb' || role === 'lm' || role === 'lw') return 'L';
  if (role === 'rb' || role === 'rm' || role === 'rw') return 'R';
  return 'C';
}

export function mapTransfermarktPosition(
  raw: string,
  elementTypeFallback?: number
): TacticalProfileDraft | null {
  const key = normalizeTransfermarktPosition(raw);
  const role = TM_TO_ROLE[key];
  if (role) {
    return { role, lane: laneForTacticalRole(role), secondary: [] };
  }
  if (elementTypeFallback === 1) {
    return { role: 'gk', lane: 'C', secondary: [] };
  }
  if (elementTypeFallback === 2) {
    return { role: 'cb', lane: 'C', secondary: [] };
  }
  if (elementTypeFallback === 3) {
    return { role: 'cm', lane: 'C', secondary: [] };
  }
  if (elementTypeFallback === 4) {
    return { role: 'st', lane: 'C', secondary: [] };
  }
  return null;
}
