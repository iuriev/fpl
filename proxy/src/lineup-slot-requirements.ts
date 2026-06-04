import type { PlayerLane } from './player-lane-registry';
import type { TacticalRole } from './player-tactical-role';

export type LineGroup = 'DEF' | 'MID' | 'FWD';

export interface RoleQuotaSingle {
  kind: 'role';
  role: TacticalRole;
  min: number;
}

export interface RoleQuotaGroup {
  kind: 'group';
  roles: TacticalRole[];
  min: number;
}

export type RoleQuota = RoleQuotaSingle | RoleQuotaGroup;

export interface LineupSlotSpec {
  lane: PlayerLane;
  role: TacticalRole;
  altRoles?: TacticalRole[];
}

export function slotAcceptsRoles(spec: LineupSlotSpec): TacticalRole[] {
  return spec.altRoles ? [spec.role, ...spec.altRoles] : [spec.role];
}

const DEF_4_QUOTAS: RoleQuota[] = [
  { kind: 'role', role: 'cb', min: 2 },
  { kind: 'role', role: 'lb', min: 1 },
  { kind: 'role', role: 'rb', min: 1 },
];

const MID_4_QUOTAS: RoleQuota[] = [
  { kind: 'group', roles: ['dm', 'cm', 'am'], min: 2 },
  { kind: 'role', role: 'lm', min: 1 },
  { kind: 'role', role: 'rm', min: 1 },
];

const FWD_3_QUOTAS: RoleQuota[] = [
  { kind: 'role', role: 'st', min: 1 },
  { kind: 'role', role: 'lw', min: 1 },
  { kind: 'role', role: 'rw', min: 1 },
];

const SLOT_SPECS: Record<string, LineupSlotSpec[]> = {
  'DEF-4': [
    { lane: 'L', role: 'lb' },
    { lane: 'C', role: 'cb' },
    { lane: 'C', role: 'cb' },
    { lane: 'R', role: 'rb' },
  ],
  'MID-4': [
    { lane: 'L', role: 'lm' },
    { lane: 'C', role: 'dm', altRoles: ['cm', 'am'] },
    { lane: 'C', role: 'cm', altRoles: ['dm', 'am'] },
    { lane: 'R', role: 'rm' },
  ],
  'FWD-3': [
    { lane: 'L', role: 'lw' },
    { lane: 'C', role: 'st' },
    { lane: 'R', role: 'rw' },
  ],
};

export function getRoleQuotasForLine(line: LineGroup, count: number): RoleQuota[] | null {
  const key = `${line}-${count}`;
  if (key === 'DEF-4') return DEF_4_QUOTAS;
  if (key === 'MID-4') return MID_4_QUOTAS;
  if (key === 'FWD-3') return FWD_3_QUOTAS;
  return null;
}

export function getLineupSlotSpecs(line: LineGroup, count: number): LineupSlotSpec[] | null {
  return SLOT_SPECS[`${line}-${count}`] ?? null;
}
