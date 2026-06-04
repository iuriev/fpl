import playerLanesData from './data/player-lanes.json';
import {
  getLineupSlotSpecs,
  type LineGroup,
  type LineupSlotSpec,
} from './lineup-slot-requirements';
import {
  fillTierForSlot,
  type FillTierOptions,
  getPlayerLaneFromProfile,
  getPlayerTacticalRole,
  hasTacticalProfile,
  isCentralOnlyMidRole,
  playerFillsSlot,
  prefersCentralSlot,
} from './player-tactical-role';

export type PlayerLane = 'L' | 'C' | 'R';

const laneFallback = playerLanesData as Record<string, PlayerLane>;

export function getPlayerLane(code: number): PlayerLane {
  if (hasTacticalProfile(code)) return getPlayerLaneFromProfile(code);
  return laneFallback[String(code)] ?? 'C';
}

const SLOT_TEMPLATES: Record<string, PlayerLane[]> = {
  'DEF-3': ['L', 'C', 'R'],
  'DEF-4': ['L', 'C', 'C', 'R'],
  'DEF-5': ['L', 'C', 'C', 'C', 'R'],
  'MID-2': ['C', 'C'],
  'MID-3': ['L', 'C', 'R'],
  'MID-4': ['L', 'C', 'C', 'R'],
  'MID-5': ['L', 'C', 'C', 'C', 'R'],
  'FWD-1': ['C'],
  'FWD-2': ['L', 'R'],
  'FWD-3': ['L', 'C', 'R'],
};

export function getSlotLanes(line: LineGroup, count: number): PlayerLane[] {
  const specs = getLineupSlotSpecs(line, count);
  if (specs) return specs.map((s) => s.lane);
  const key = `${line}-${count}`;
  const template = SLOT_TEMPLATES[key];
  if (template) return [...template];
  return Array.from({ length: count }, () => 'C' as PlayerLane);
}

function lanesOnlyToSpecs(line: LineGroup, lanes: PlayerLane[]): LineupSlotSpec[] {
  return lanes.map((lane) => {
    if (line === 'DEF') {
      return {
        lane,
        role: lane === 'L' ? 'lb' : lane === 'R' ? 'rb' : 'cb',
      };
    }
    if (line === 'FWD') {
      return {
        lane,
        role: lane === 'L' ? 'lw' : lane === 'R' ? 'rw' : 'st',
      };
    }
    return {
      lane,
      role: lane === 'L' ? 'lm' : lane === 'R' ? 'rm' : 'cm',
      altRoles: lane === 'C' ? ['dm', 'am'] : undefined,
    };
  });
}

function laneMismatchCost(playerLane: PlayerLane, slotLane: PlayerLane): number {
  if (playerLane === slotLane) return 0;
  if (playerLane === 'C' || slotLane === 'C') return 1;
  return 2;
}

function isWingSlot(spec: LineupSlotSpec): boolean {
  return spec.lane === 'L' || spec.lane === 'R';
}

function isWideProfileRole(role: ReturnType<typeof getPlayerTacticalRole>): boolean {
  return (
    role === 'lb' ||
    role === 'rb' ||
    role === 'lm' ||
    role === 'rm' ||
    role === 'lw' ||
    role === 'rw'
  );
}

function isCentralLineSlot(spec: LineupSlotSpec, line: LineGroup): boolean {
  return spec.lane === 'C' && (line === 'DEF' || line === 'MID' || line === 'FWD');
}

function slotAssignmentCost(
  player: LaneAssignablePlayer,
  slot: LineupSlotSpec,
  line: LineGroup,
  options?: FillTierOptions
): number {
  const fillTier = fillTierForSlot(player.code, slot, line, options);
  if (fillTier >= 3) return Number.POSITIVE_INFINITY;

  const laneCost = laneMismatchCost(getPlayerLaneFromProfile(player.code), slot.lane);
  const role = getPlayerTacticalRole(player.code);

  let roleBias = 0;
  if (prefersCentralSlot(player.code) && isWingSlot(slot)) roleBias += 500;
  if (isWideProfileRole(role) && isCentralLineSlot(slot, line)) roleBias += 300;
  if (isCentralOnlyMidRole(role) && (slot.role === 'lm' || slot.role === 'rm')) {
    roleBias += 50_000;
  }
  if (role === 'st' && (slot.role === 'lw' || slot.role === 'rw')) roleBias += 50_000;

  return fillTier * 10_000 + laneCost * 1_000 + roleBias;
}

export interface LaneAssignablePlayer {
  id: number;
  code: number;
  startScore: number;
}

export interface LaneAssignedPlayer extends LaneAssignablePlayer {
  lane: PlayerLane;
  pitchOrder: number;
}

export function assignPlayersToSlots(
  players: LaneAssignablePlayer[],
  line: LineGroup,
  count: number
): LaneAssignedPlayer[] {
  if (players.length === 0) return [];

  const specs =
    getLineupSlotSpecs(line, count) ??
    lanesOnlyToSpecs(line, getSlotLanes(line, count));

  const openSlots = specs.map((spec, pitchOrder) => ({ ...spec, pitchOrder }));
  const assigned: LaneAssignedPlayer[] = [];
  const byMerit = [...players].sort((a, b) => b.startScore - a.startScore);

  for (const player of byMerit) {
    let bestIdx = -1;
    let bestCost = Number.POSITIVE_INFINITY;
    for (let i = 0; i < openSlots.length; i++) {
      const cost = slotAssignmentCost(player, openSlots[i], line);
      if (cost < bestCost) {
        bestCost = cost;
        bestIdx = i;
      }
    }
    if (bestIdx < 0 || !Number.isFinite(bestCost)) {
      for (let i = 0; i < openSlots.length; i++) {
        const cost = slotAssignmentCost(player, openSlots[i], line, {
          allowCentralOnWide: true,
        });
        if (cost < bestCost) {
          bestCost = cost;
          bestIdx = i;
        }
      }
    }
    if (bestIdx < 0) {
      const fallbackIdx = openSlots.findIndex((slot) =>
        playerFillsSlot(player.code, slot, line, { allowCentralOnWide: true })
      );
      if (fallbackIdx < 0) continue;
      bestIdx = fallbackIdx;
    }
    const slot = openSlots.splice(bestIdx, 1)[0];
    assigned.push({
      ...player,
      lane: slot.lane,
      pitchOrder: slot.pitchOrder,
    });
  }

  return assigned.sort((a, b) => a.pitchOrder - b.pitchOrder);
}
