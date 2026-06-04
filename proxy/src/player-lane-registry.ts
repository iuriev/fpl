import playerLanesData from './data/player-lanes.json';
import {
  getLineupSlotSpecs,
  type LineGroup,
  type LineupSlotSpec,
} from './lineup-slot-requirements';
import {
  bestSlotMeritScore,
  fillTierForRole,
  fillTierForSlot,
  type FillTierOptions,
  getPlayerLaneFromProfile,
  getPlayerTacticalProfile,
  getPlayerTacticalRole,
  hasTacticalProfile,
  isCentralOnlyMidRole,
  isWidePrimaryOnLine,
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

export interface AssignLaneOptions {
  lastMatchLaneById?: Map<number, PlayerLane>;
}

function laneMismatchCost(playerLane: PlayerLane, slotLane: PlayerLane): number {
  if (playerLane === slotLane) return 0;
  if (playerLane === 'C' || slotLane === 'C') return 1;
  return 2;
}

function preferredLane(
  player: LaneAssignablePlayer,
  options?: AssignLaneOptions
): PlayerLane {
  return options?.lastMatchLaneById?.get(player.id) ?? getPlayerLaneFromProfile(player.code);
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

function canFillWingSlot(code: number, slot: LineupSlotSpec, line: LineGroup): boolean {
  if (isWidePrimaryOnLine(code, line)) {
    return fillTierForRole(code, slot.role, line) <= 1;
  }
  return fillTierForRole(code, slot.role, line) === 0;
}

function blocksWidePrimaryFromCentral(
  code: number,
  slot: LineupSlotSpec,
  line: LineGroup,
  options?: FillTierOptions
): boolean {
  if (!options?.blockWideFromCentral) return false;
  if (!isCentralLineSlot(slot, line)) return false;
  return isWidePrimaryOnLine(code, line);
}

function slotAssignmentCost(
  player: LaneAssignablePlayer,
  slot: LineupSlotSpec,
  line: LineGroup,
  fillOptions?: FillTierOptions,
  laneOptions?: AssignLaneOptions
): number {
  if (blocksWidePrimaryFromCentral(player.code, slot, line, fillOptions)) {
    return Number.POSITIVE_INFINITY;
  }

  let fillTier = fillTierForSlot(player.code, slot, line, fillOptions);
  if (fillTier >= 3 && fillOptions?.allowCentralOnWide) {
    fillTier = 2;
  }
  if (fillTier >= 3) return Number.POSITIVE_INFINITY;

  const laneCost = laneMismatchCost(preferredLane(player, laneOptions), slot.lane);
  const role = getPlayerTacticalRole(player.code);

  let roleBias = 0;
  if (prefersCentralSlot(player.code, line) && isWingSlot(slot)) roleBias += 500;
  if (isWideProfileRole(role) && isCentralLineSlot(slot, line)) roleBias += 300;
  if (isCentralOnlyMidRole(role) && (slot.role === 'lm' || slot.role === 'rm')) {
    roleBias += 50_000;
  }
  if (role === 'st' && (slot.role === 'lw' || slot.role === 'rw')) roleBias += 50_000;

  const slotMerit = bestSlotMeritScore(player.code, slot, line, player.startScore);
  return fillTier * 10_000 + laneCost * 1_000 + roleBias - slotMerit * 1_000;
}

function forceSlotAssignmentCost(
  player: LaneAssignablePlayer,
  slot: LineupSlotSpec,
  line: LineGroup,
  laneOptions?: AssignLaneOptions
): number {
  const laneCost = laneMismatchCost(preferredLane(player, laneOptions), slot.lane);
  const slotMerit = bestSlotMeritScore(player.code, slot, line, player.startScore);
  return laneCost * 1_000 - slotMerit * 1_000;
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

type SlotWithOrder = LineupSlotSpec & { pitchOrder: number };

function isRightWingSlot(spec: SlotWithOrder, line: LineGroup): boolean {
  if (spec.lane === 'R') return true;
  if (line === 'DEF') return spec.role === 'rb';
  if (line === 'MID') return spec.role === 'rm';
  return spec.role === 'rw';
}

function wingSlotsAssignOrder(slots: SlotWithOrder[], line: LineGroup): SlotWithOrder[] {
  return [...slots].sort((a, b) => {
    const aRight = isRightWingSlot(a, line);
    const bRight = isRightWingSlot(b, line);
    if (aRight !== bRight) return aRight ? -1 : 1;
    return a.pitchOrder - b.pitchOrder;
  });
}

function assignOpenSlots(
  openSlots: SlotWithOrder[],
  remaining: LaneAssignablePlayer[],
  assigned: LaneAssignedPlayer[],
  line: LineGroup,
  fillOptions?: FillTierOptions,
  laneOptions?: AssignLaneOptions
): void {
  const ordered = fillOptions?.wingPrimaryOnly
    ? wingSlotsAssignOrder(openSlots, line)
    : [...openSlots].sort((a, b) => a.pitchOrder - b.pitchOrder);
  for (const slot of ordered) {
    let bestPi = -1;
    let bestCost = Number.POSITIVE_INFINITY;
    for (let pi = 0; pi < remaining.length; pi++) {
      const player = remaining[pi]!;
      if (fillOptions?.wingPrimaryOnly && !canFillWingSlot(player.code, slot, line)) {
        continue;
      }
      const cost = slotAssignmentCost(player, slot, line, fillOptions, laneOptions);
      if (cost < bestCost) {
        bestCost = cost;
        bestPi = pi;
      }
    }
    if (bestPi < 0 || !Number.isFinite(bestCost)) continue;
    const player = remaining.splice(bestPi, 1)[0]!;
    const slotIdx = openSlots.findIndex((s) => s.pitchOrder === slot.pitchOrder);
    if (slotIdx >= 0) openSlots.splice(slotIdx, 1);
    assigned.push({
      ...player,
      lane: slot.lane,
      pitchOrder: slot.pitchOrder,
    });
  }
}

function forceAssignRemaining(
  openSlots: SlotWithOrder[],
  remaining: LaneAssignablePlayer[],
  assigned: LaneAssignedPlayer[],
  line: LineGroup,
  laneOptions?: AssignLaneOptions
): void {
  for (const player of [...remaining]) {
    if (openSlots.length === 0) break;
    let bestIdx = 0;
    let bestCost = Number.POSITIVE_INFINITY;
    for (let i = 0; i < openSlots.length; i++) {
      const cost = forceSlotAssignmentCost(player, openSlots[i]!, line, laneOptions);
      if (cost < bestCost) {
        bestCost = cost;
        bestIdx = i;
      }
    }
    const slot = openSlots.splice(bestIdx, 1)[0]!;
    const pi = remaining.findIndex((p) => p.id === player.id);
    if (pi >= 0) remaining.splice(pi, 1);
    assigned.push({
      ...player,
      lane: slot.lane,
      pitchOrder: slot.pitchOrder,
    });
  }
}

export function assignPlayersToSlots(
  players: LaneAssignablePlayer[],
  line: LineGroup,
  count: number,
  laneOptions?: AssignLaneOptions
): LaneAssignedPlayer[] {
  if (players.length === 0) return [];

  const specs =
    getLineupSlotSpecs(line, count) ??
    lanesOnlyToSpecs(line, getSlotLanes(line, count));

  const openWingSlots = specs
    .map((spec, pitchOrder) => ({ ...spec, pitchOrder }))
    .filter(isWingSlot);
  const openCentralSlots = specs
    .map((spec, pitchOrder) => ({ ...spec, pitchOrder }))
    .filter((s) => s.lane === 'C');

  const remaining = [...players];
  const assigned: LaneAssignedPlayer[] = [];

  assignOpenSlots(
    openWingSlots,
    remaining,
    assigned,
    line,
    { wingPrimaryOnly: true },
    laneOptions
  );
  assignOpenSlots(
    openCentralSlots,
    remaining,
    assigned,
    line,
    { blockWideFromCentral: true },
    laneOptions
  );

  const openAny = [...openWingSlots, ...openCentralSlots];
  assignOpenSlots(openAny, remaining, assigned, line, { allowCentralOnWide: true }, laneOptions);

  forceAssignRemaining(openAny, remaining, assigned, line, laneOptions);

  const assignedIds = new Set(assigned.map((a) => a.id));
  for (const player of players) {
    if (assignedIds.has(player.id)) continue;
    const slot = openAny.shift();
    assigned.push({
      ...player,
      lane: slot?.lane ?? preferredLane(player, laneOptions),
      pitchOrder: slot?.pitchOrder ?? assigned.length,
    });
    assignedIds.add(player.id);
  }

  return assigned.sort((a, b) => a.pitchOrder - b.pitchOrder);
}
