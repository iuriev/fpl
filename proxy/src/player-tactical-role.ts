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
  blockWideFromCentral?: boolean;
  wingPrimaryOnly?: boolean;
}

export function isCentralOnlyMidRole(role: TacticalRole): boolean {
  return CENTRAL_MID_ROLES.includes(role);
}

export function lineAwarePrimaryRole(role: TacticalRole, line: LineGroup): TacticalRole {
  if (line === 'MID') {
    if (role === 'rw') return 'rm';
    if (role === 'lw') return 'lm';
  }
  if (line === 'FWD' && role === 'rm') return 'rw';
  return role;
}

function lineAwareRoles(
  profile: PlayerTacticalProfile,
  line: LineGroup
): { primary: TacticalRole; secondary: TacticalRole[] } {
  return {
    primary: lineAwarePrimaryRole(profile.role, line),
    secondary: (profile.secondary ?? []).map((r) => lineAwarePrimaryRole(r, line)),
  };
}

export function isWidePrimaryOnLine(code: number, line: LineGroup): boolean {
  const primary = lineAwarePrimaryRole(getPlayerTacticalProfile(code).role, line);
  if (line === 'DEF') return primary === 'lb' || primary === 'rb';
  if (line === 'MID') return primary === 'lm' || primary === 'rm';
  return primary === 'lw' || primary === 'rw';
}

const WING_QUOTA_ROLES: Partial<Record<LineGroup, TacticalRole[]>> = {
  DEF: ['lb', 'rb'],
  MID: ['lm', 'rm'],
  FWD: ['lw', 'rw'],
};

export function isWingQuotaRole(role: TacticalRole, line: LineGroup): boolean {
  return WING_QUOTA_ROLES[line]?.includes(role) ?? false;
}

function blocksCentralOnlyFromWideSlot(
  profileRole: TacticalRole,
  slotRole: TacticalRole,
  line: LineGroup
): boolean {
  const primary = lineAwarePrimaryRole(profileRole, line);
  if (line === 'MID' && isCentralOnlyMidRole(primary) && WIDE_MID_ROLES.includes(slotRole)) {
    return true;
  }
  if (line === 'FWD' && primary === 'st' && WIDE_FWD_ROLES.includes(slotRole)) {
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
  const { primary, secondary } = lineAwareRoles(profile, line);
  if (
    !options?.allowCentralOnWide &&
    blocksCentralOnlyFromWideSlot(profile.role, slotRole, line)
  ) {
    return 3;
  }
  if (primary === slotRole) return 0;
  if (secondary.includes(slotRole)) return 1;
  const group = ROLE_GROUPS[line];
  if (group.includes(primary) && group.includes(slotRole)) {
    if (line === 'MID' && WIDE_MID_ROLES.includes(primary) && WIDE_MID_ROLES.includes(slotRole)) {
      return 3;
    }
    if (
      line === 'DEF' &&
      ((primary === 'lb' && slotRole === 'rb') || (primary === 'rb' && slotRole === 'lb'))
    ) {
      return 3;
    }
    if (
      line === 'FWD' &&
      ((primary === 'lw' && slotRole === 'rw') || (primary === 'rw' && slotRole === 'lw'))
    ) {
      return 3;
    }
    return 2;
  }
  return 3;
}

export function playerFillsRole(
  code: number,
  slotRole: TacticalRole,
  line: LineGroup
): boolean {
  return fillTierForRole(code, slotRole, line) < 3;
}

export function playerQualifiesForQuotaRole(
  code: number,
  slotRole: TacticalRole,
  line: LineGroup
): boolean {
  return fillTierForRole(code, slotRole, line) === 0;
}

export function playerQualifiesForAnyQuotaRole(
  code: number,
  slotRoles: TacticalRole[],
  line: LineGroup
): boolean {
  return slotRoles.some((r) => playerQualifiesForQuotaRole(code, r, line));
}

export function playerQualifiesForWingQuotaRole(
  code: number,
  slotRole: TacticalRole,
  line: LineGroup
): boolean {
  const tier = fillTierForRole(code, slotRole, line);
  if (tier === 0) return true;
  if (tier === 1 && isWidePrimaryOnLine(code, line)) return true;
  return false;
}

export function playerQualifiesForAnyWingQuotaRole(
  code: number,
  slotRoles: TacticalRole[],
  line: LineGroup
): boolean {
  return slotRoles.some((r) => playerQualifiesForWingQuotaRole(code, r, line));
}

export function playerCoversWingRole(
  code: number,
  wingRole: TacticalRole,
  line: LineGroup
): boolean {
  return fillTierForRole(code, wingRole, line) <= 1;
}

export function roleMeritMultiplier(fillTier: number): number {
  if (fillTier === 0) return 1;
  if (fillTier === 1) return 0.85;
  if (fillTier === 2) return 0.35;
  return 0;
}

export function roleMeritScore(
  code: number,
  slotRole: TacticalRole,
  line: LineGroup,
  baseMerit: number
): number {
  const tier = fillTierForRole(code, slotRole, line);
  return baseMerit * roleMeritMultiplier(tier);
}

export function bestQuotaRoleMeritScore(
  code: number,
  slotRoles: TacticalRole[],
  line: LineGroup,
  baseMerit: number
): number {
  let best = 0;
  for (const role of slotRoles) {
    best = Math.max(best, roleMeritScore(code, role, line, baseMerit));
  }
  return best;
}

export function bestSlotMeritScore(
  code: number,
  slot: LineupSlotSpec,
  line: LineGroup,
  baseMerit: number
): number {
  let best = 0;
  for (const role of slotAcceptsRoles(slot)) {
    best = Math.max(best, roleMeritScore(code, role, line, baseMerit));
  }
  return best;
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

export function prefersCentralSlot(code: number, line: LineGroup): boolean {
  const role = lineAwarePrimaryRole(getPlayerTacticalProfile(code).role, line);
  if (line === 'DEF') return role === 'cb';
  if (line === 'MID') return role === 'dm' || role === 'cm' || role === 'am';
  return role === 'st';
}
