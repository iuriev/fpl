import type {
  PlayerPosition,
  PoolPlayer,
  SquadPlayer,
  SubSwap,
  TransferChip,
  TransferDraft,
  TransferSwap,
} from '@/types';

const DRAFT_KEY = (teamId: number) => `fpl-transfer-draft-${teamId}`;

export function readLocalDraft(teamId: number): TransferDraft | null {
  const raw = localStorage.getItem(DRAFT_KEY(teamId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<TransferDraft>;
    return { ...(parsed as TransferDraft), subs: parsed.subs ?? [] };
  } catch {
    return null;
  }
}

export function removeLocalDraft(teamId: number): void {
  localStorage.removeItem(DRAFT_KEY(teamId));
}

export function calcBank(
  initialBank: number,
  swaps: TransferSwap[],
  allPlayers: Array<{ id: number; nowCost: number; sellPrice?: number }>
): number {
  return swaps.reduce((bank, swap) => {
    const out = allPlayers.find((p) => p.id === swap.outId);
    const ins = allPlayers.find((p) => p.id === swap.inId);
    if (!out || !ins) return bank;
    const sellValue = out.sellPrice ?? out.nowCost;
    return bank + sellValue - ins.nowCost;
  }, initialBank);
}

const POSITION_ORDER: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];

export function augmentPoolWithSuggested(
  pool: PoolPlayer[],
  suggested: Array<{ id: number; position: PlayerPosition; nowCost: number; xPts?: number }>
): PoolPlayer[] {
  const byId = new Map(pool.map((p) => [p.id, p]));
  for (const s of suggested) {
    const existing = byId.get(s.id);
    if (existing) {
      if (s.xPts != null) {
        byId.set(s.id, { ...existing, expectedPoints: s.xPts.toFixed(1) });
      }
      continue;
    }
    byId.set(s.id, {
      id: s.id,
      code: 0,
      webName: `Player ${s.id}`,
      firstName: '',
      lastName: '',
      team: 0,
      teamCode: 0,
      teamShortName: '???',
      position: s.position,
      nowCost: s.nowCost,
      totalPoints: 0,
      eventPoints: 0,
      status: 'a',
      chanceOfPlaying: null,
      news: '',
      selectedByPercent: '0',
      expectedPoints: s.xPts != null ? s.xPts.toFixed(1) : '0',
      form: '0',
      nextFixtures: [],
    });
  }
  return [...byId.values()];
}

export function squadIdsAfterSwaps(
  originalSquad: SquadPlayer[],
  swaps: TransferSwap[],
  poolPlayers: PoolPlayer[]
): Set<number> {
  return new Set(applySwapsToSquad(originalSquad, swaps, poolPlayers).map((p) => p.id));
}

export function buildFreeHitSwaps(
  currentSquad: Array<{ id: number; position: PlayerPosition }>,
  targetIds: number[],
  positionById: Map<number, PlayerPosition>
): TransferSwap[] {
  const uniqueTarget = [...new Set(targetIds)];
  const targetSet = new Set(uniqueTarget);
  const currentSet = new Set(currentSquad.map((p) => p.id));

  const outsByPos: Record<PlayerPosition, number[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  const insByPos: Record<PlayerPosition, number[]> = { GK: [], DEF: [], MID: [], FWD: [] };

  for (const p of currentSquad) {
    if (!targetSet.has(p.id)) outsByPos[p.position].push(p.id);
  }
  for (const id of uniqueTarget) {
    if (currentSet.has(id)) continue;
    const pos = positionById.get(id);
    if (pos) insByPos[pos].push(id);
  }

  const swaps: TransferSwap[] = [];
  for (const pos of POSITION_ORDER) {
    const outs = outsByPos[pos];
    const ins = insByPos[pos];
    const n = Math.min(outs.length, ins.length);
    for (let i = 0; i < n; i++) {
      swaps.push({ outId: outs[i], inId: ins[i] });
    }
  }
  return swaps;
}

export function isFormationValid(
  starters: Array<{ position: PlayerPosition }>
): boolean {
  let def = 0;
  let mid = 0;
  let fwd = 0;
  for (const p of starters) {
    if (p.position === 'DEF') def++;
    else if (p.position === 'MID') mid++;
    else if (p.position === 'FWD') fwd++;
  }
  return def >= 3 && def <= 5 && mid >= 2 && mid <= 5 && fwd >= 1 && fwd <= 3;
}

export function applySwapsToSquad(
  originalSquad: SquadPlayer[],
  swaps: TransferSwap[],
  poolPlayers: PoolPlayer[]
): SquadPlayer[] {
  const swapMap = new Map(swaps.map((s) => [s.outId, s.inId]));
  return originalSquad.map((p) => {
    const inId = swapMap.get(p.id);
    if (!inId) return p;
    const replacement = poolPlayers.find((pl) => pl.id === inId);
    if (!replacement) return p;
    const next = poolPlayerToSquadPlayer(replacement);
    return {
      ...next,
      isCaptain: p.isCaptain,
      isViceCaptain: p.isViceCaptain,
    };
  });
}

export function buildFreeHitSubs(
  squadAfterSwaps: SquadPlayer[],
  targetOrderedSquad: number[],
  _startersCount: number
): SubSwap[] {

  if (squadAfterSwaps.length !== 15 || targetOrderedSquad.length !== 15) return [];
  return buildFreeHitOrderSubs(squadAfterSwaps, targetOrderedSquad);
}

export function buildFreeHitOrderSubs(
  squadAfterSwaps: SquadPlayer[],
  targetOrderedSquad: number[]
): SubSwap[] {
  if (squadAfterSwaps.length !== 15 || targetOrderedSquad.length !== 15) return [];

  const working = squadAfterSwaps.map((p) => ({ ...p }));
  const subs: SubSwap[] = [];

  for (let i = 0; i < 15; i++) {
    if (working[i].id === targetOrderedSquad[i]) continue;
    const j = working.findIndex((p) => p.id === targetOrderedSquad[i]);
    if (j === -1) return subs;
    subs.push({ fieldId: working[i].id, benchId: working[j].id });
    [working[i], working[j]] = [working[j], working[i]];
  }

  return subs;
}

export function calcTransferCost(
  swapCount: number,
  freeTransfers: number,
  chip: TransferChip
): number {
  if (chip !== 'none') return 0;
  return Math.max(0, swapCount - freeTransfers) * 4;
}

export function wouldExceedClubLimit(
  currentSquad: Array<{ id: number; teamId: number }>,
  newPlayer: { id: number; team: number },
  outPlayerId: number
): boolean {
  const squadWithoutOut = currentSquad.filter((p) => p.id !== outPlayerId);
  return squadWithoutOut.filter((p) => p.teamId === newPlayer.team).length >= 3;
}

const ZERO_STATS: SquadPlayer['stats'] = {
  minutes: 0,
  goals_scored: 0,
  assists: 0,
  clean_sheets: 0,
  goals_conceded: 0,
  own_goals: 0,
  penalties_saved: 0,
  penalties_missed: 0,
  yellow_cards: 0,
  red_cards: 0,
  saves: 0,
  bonus: 0,
  total_points: 0,
};

export function poolPlayerToSquadPlayer(p: PoolPlayer): SquadPlayer {
  return {
    id: p.id,
    fplCode: p.code,
    name: p.webName,
    position: p.position,
    club: p.teamShortName,
    teamCode: p.teamCode,
    teamId: p.team,
    nowCost: p.nowCost,
    points: 0,
    isCaptain: false,
    isViceCaptain: false,
    status: p.status,
    chanceOfPlaying: p.chanceOfPlaying,
    news: p.news || undefined,
    stats: ZERO_STATS,
  };
}
