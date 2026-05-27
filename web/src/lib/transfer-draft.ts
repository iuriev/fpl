import type { PoolPlayer, SquadPlayer, TransferChip, TransferDraft, TransferSwap } from '@/types';

const DRAFT_KEY = (teamId: number) => `fpl-transfer-draft-${teamId}`;

export function saveDraft(draft: TransferDraft): void {
  localStorage.setItem(DRAFT_KEY(draft.teamId), JSON.stringify(draft));
}

export function loadDraft(teamId: number, currentNextGw: number): TransferDraft | null {
  const raw = localStorage.getItem(DRAFT_KEY(teamId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<TransferDraft>;
    if (parsed.targetGw !== currentNextGw) {
      localStorage.removeItem(DRAFT_KEY(teamId));
      return null;
    }
    return { ...(parsed as TransferDraft), subs: parsed.subs ?? [] };
  } catch {
    localStorage.removeItem(DRAFT_KEY(teamId));
    return null;
  }
}

export function clearDraft(teamId: number): void {
  localStorage.removeItem(DRAFT_KEY(teamId));
}

export function calcBank(
  initialBank: number,
  swaps: TransferSwap[],
  allPlayers: Array<{ id: number; nowCost: number }>,
): number {
  return swaps.reduce((bank, swap) => {
    const out = allPlayers.find((p) => p.id === swap.outId);
    const ins = allPlayers.find((p) => p.id === swap.inId);
    if (!out || !ins) return bank;
    return bank + out.nowCost - ins.nowCost;
  }, initialBank);
}

export function calcTransferCost(
  swapCount: number,
  freeTransfers: number,
  chip: TransferChip,
): number {
  if (chip !== 'none') return 0;
  return Math.max(0, swapCount - freeTransfers) * 4;
}

export function wouldExceedClubLimit(
  currentSquad: Array<{ id: number; teamId: number }>,
  newPlayer: { id: number; team: number },
  outPlayerId: number,
): boolean {
  const squadWithoutOut = currentSquad.filter((p) => p.id !== outPlayerId);
  return squadWithoutOut.filter((p) => p.teamId === newPlayer.team).length >= 3;
}

const ZERO_STATS: SquadPlayer['stats'] = {
  minutes: 0, goals_scored: 0, assists: 0, clean_sheets: 0,
  goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0,
  yellow_cards: 0, red_cards: 0, saves: 0, bonus: 0, total_points: 0,
};

export function poolPlayerToSquadPlayer(p: PoolPlayer): SquadPlayer {
  return {
    id: p.id,
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
