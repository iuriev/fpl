import playerLanesData from './data/player-lanes.json';

export type PlayerLane = 'L' | 'C' | 'R';

const registry = playerLanesData as Record<string, PlayerLane>;

export function getPlayerLane(code: number): PlayerLane {
  return registry[String(code)] ?? 'C';
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

export function getSlotLanes(line: 'DEF' | 'MID' | 'FWD', count: number): PlayerLane[] {
  const key = `${line}-${count}`;
  const template = SLOT_TEMPLATES[key];
  if (template) return [...template];
  return Array.from({ length: count }, () => 'C' as PlayerLane);
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
  slotLanes: PlayerLane[]
): LaneAssignedPlayer[] {
  if (players.length === 0) return [];

  const slots = slotLanes.map((lane, pitchOrder) => ({ lane, pitchOrder }));
  const remaining = [...players];
  const assigned: LaneAssignedPlayer[] = [];

  const slotOrder = [...slots].sort((a, b) => {
    const rank = (lane: PlayerLane) => (lane === 'C' ? 0 : 1);
    return rank(a.lane) - rank(b.lane) || a.pitchOrder - b.pitchOrder;
  });

  for (const slot of slotOrder) {
    let bestIdx = 0;
    let bestKey = Number.POSITIVE_INFINITY;
    for (let i = 0; i < remaining.length; i++) {
      const p = remaining[i];
      const cost = laneMismatchCost(getPlayerLane(p.code), slot.lane);
      const key = cost * 1000 - p.startScore;
      if (key < bestKey) {
        bestKey = key;
        bestIdx = i;
      }
    }
    const [picked] = remaining.splice(bestIdx, 1);
    assigned.push({
      ...picked,
      lane: slot.lane,
      pitchOrder: slot.pitchOrder,
    });
  }

  return assigned.sort((a, b) => a.pitchOrder - b.pitchOrder);
}
