import rolesData from './data/player-tactical-roles.json';
import {
  type LineGroup,
  type LineupSlotSpec,
  slotAcceptsRoles,
} from './lineup-slot-requirements';
import type { PlayerLane } from './player-lane-registry';

export type TacticalRole =
  | 'gk'
  | 'lb'
  | 'cb'
  | 'rb'
  | 'dm'
  | 'cm'
  | 'am'
  | 'lm'
  | 'rm'
  | 'lw'
  | 'rw'
  | 'st';

export interface PlayerTacticalProfile {
  role: TacticalRole;
  lane: PlayerLane;
  secondary?: TacticalRole[];
}

const registry = rolesData as Record<string, PlayerTacticalProfile>;

const ROLE_GROUPS: Record<LineGroup, TacticalRole[]> = {
  DEF: ['lb', 'cb', 'rb'],
  MID: ['dm', 'cm', 'am', 'lm', 'rm'],
  FWD: ['lw', 'rw', 'st'],
};

const WIDE_MID_ROLES: TacticalRole[] = ['lm', 'rm'];
const WIDE_FWD_ROLES: TacticalRole[] = ['lw', 'rw'];
const CENTRAL_MID_ROLES: TacticalRole[] = ['dm', 'cm', 'am'];

export interface FillTierOptions {
  allowCentralOnWide?: boolean;
}

export function isCentralOnlyMidRole(role: TacticalRole): boolean {
  return CENTRAL_MID_ROLES.includes(role);
}

function blocksCentralOnlyFromWideSlot(
  profileRole: TacticalRole,
  slotRole: TacticalRole,
  line: LineGroup
): boolean {
  if (line === 'MID' && isCentralOnlyMidRole(profileRole) && WIDE_MID_ROLES.includes(slotRole)) {
    return true;
  }
  if (line === 'FWD' && profileRole === 'st' && WIDE_FWD_ROLES.includes(slotRole)) {
    return true;
  }
  return false;
}

export function laneForRole(role: TacticalRole): PlayerLane {
  if (role === 'lb' || role === 'lm' || role === 'lw') return 'L';
  if (role === 'rb' || role === 'rm' || role === 'rw') return 'R';
  return 'C';
}

export function hasTacticalProfile(code: number): boolean {
  return registry[String(code)] !== undefined;
}

export function getPlayerTacticalProfile(code: number): PlayerTacticalProfile {
  const row = registry[String(code)];
  if (row) {
    return {
      role: row.role,
      lane: row.lane ?? laneForRole(row.role),
      secondary: row.secondary ?? [],
    };
  }
  return { role: 'cm', lane: 'C', secondary: [] };
}

export function getPlayerTacticalRole(code: number): TacticalRole {
  return getPlayerTacticalProfile(code).role;
}

export function getPlayerLaneFromProfile(code: number): PlayerLane {
  return getPlayerTacticalProfile(code).lane;
}

export function fillTierForRole(
  code: number,
  slotRole: TacticalRole,
  line: LineGroup,
  options?: FillTierOptions
): number {
  const profile = getPlayerTacticalProfile(code);
  if (
    !options?.allowCentralOnWide &&
    blocksCentralOnlyFromWideSlot(profile.role, slotRole, line)
  ) {
    return 3;
  }
  if (profile.role === slotRole) return 0;
  if (profile.secondary?.includes(slotRole)) return 1;
  const group = ROLE_GROUPS[line];
  if (group.includes(profile.role) && group.includes(slotRole)) return 2;
  return 3;
}

export function playerFillsRole(
  code: number,
  slotRole: TacticalRole,
  line: LineGroup
): boolean {
  return fillTierForRole(code, slotRole, line) < 3;
}

export function playerFillsAnyRole(
  code: number,
  slotRoles: TacticalRole[],
  line: LineGroup
): boolean {
  return slotRoles.some((r) => playerFillsRole(code, r, line));
}

export function fillTierForSlot(
  code: number,
  slot: LineupSlotSpec,
  line: LineGroup,
  options?: FillTierOptions
): number {
  const roles = slotAcceptsRoles(slot);
  let best = 3;
  for (const r of roles) {
    best = Math.min(best, fillTierForRole(code, r, line, options));
  }
  return best;
}

export function playerFillsSlot(
  code: number,
  slot: LineupSlotSpec,
  line: LineGroup,
  options?: FillTierOptions
): boolean {
  return fillTierForSlot(code, slot, line, options) < 3;
}

export function prefersCentralSlot(code: number): boolean {
  const role = getPlayerTacticalRole(code);
  return (
    role === 'cb' ||
    role === 'dm' ||
    role === 'cm' ||
    role === 'am' ||
    role === 'st'
  );
}
