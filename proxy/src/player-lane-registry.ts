import playerLanesData from './data/player-lanes.json';
import {
  getLineupSlotSpecs,
  type LineGroup,
  type LineupSlotSpec,
} from './lineup-slot-requirements';
import {
  fillTierForSlot,
  getPlayerLaneFromProfile,
  hasTacticalProfile,
  playerFillsSlot,
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

  const slots = specs.map((spec, pitchOrder) => ({ ...spec, pitchOrder }));
  const remaining = [...players];
  const assigned: LaneAssignedPlayer[] = [];

  const slotOrder = [...slots].sort((a, b) => {
    const tier = (s: LineupSlotSpec) => {
      if (s.role === 'lb' || s.role === 'lm' || s.role === 'lw') return 0;
      if (s.role === 'rb' || s.role === 'rm' || s.role === 'rw') return 0;
      return 1;
    };
    return tier(a) - tier(b) || a.pitchOrder - b.pitchOrder;
  });

  for (const slot of slotOrder) {
    let pool = remaining.filter((p) => playerFillsSlot(p.code, slot, line));
    if (pool.length === 0) pool = remaining;

    let bestIdx = 0;
    let bestKey = Number.POSITIVE_INFINITY;
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      const fillTier = fillTierForSlot(p.code, slot, line);
      const cost = laneMismatchCost(getPlayerLaneFromProfile(p.code), slot.lane);
      const key = fillTier * 10_000 + cost * 1000 - p.startScore;
      if (key < bestKey) {
        bestKey = key;
        bestIdx = i;
      }
    }
    const pickedFromPool = pool[bestIdx];
    const bestIdxInRemaining = remaining.findIndex((p) => p.id === pickedFromPool.id);
    const [picked] = remaining.splice(bestIdxInRemaining, 1);
    assigned.push({
      ...picked,
      lane: slot.lane,
      pitchOrder: slot.pitchOrder,
    });
  }

  return assigned.sort((a, b) => a.pitchOrder - b.pitchOrder);
}
