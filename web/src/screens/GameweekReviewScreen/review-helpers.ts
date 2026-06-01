import type { PoolPlayer, SquadPlayer } from '@/types';

export interface TransferPair {
  out: { id: number; name: string; gwPoints: number };
  in: { id: number; name: string; gwPoints: number };
}

export function findReviewGw(
  gameweeks: Array<{ id: number; finished: boolean }>
): number | null {
  const finished = gameweeks.filter((gw) => gw.finished);
  return finished.length > 0 ? finished[finished.length - 1].id : null;
}

export function diffSquads(
  currentPlayers: SquadPlayer[],
  previousPlayers: SquadPlayer[]
): { transferredInIds: number[]; transferredOutIds: number[] } {
  const currentIds = new Set(currentPlayers.map((p) => p.id));
  const previousIds = new Set(previousPlayers.map((p) => p.id));
  return {
    transferredInIds: currentPlayers.filter((p) => !previousIds.has(p.id)).map((p) => p.id),
    transferredOutIds: previousPlayers.filter((p) => !currentIds.has(p.id)).map((p) => p.id),
  };
}

export function buildTransferPairs(
  currentPlayers: SquadPlayer[],
  previousPlayers: SquadPlayer[],
  playerPool: PoolPlayer[],
  transferredInIds: number[],
  transferredOutIds: number[]
): TransferPair[] {
  const poolMap = new Map(playerPool.map((p) => [p.id, p]));
  const currentMap = new Map(currentPlayers.map((p) => [p.id, p]));
  const previousMap = new Map(previousPlayers.map((p) => [p.id, p]));

  const count = Math.min(transferredInIds.length, transferredOutIds.length);
  return Array.from({ length: count }, (_, i) => {
    const inId = transferredInIds[i];
    const outId = transferredOutIds[i];
    const inPlayer = currentMap.get(inId)!;
    const outPrev = previousMap.get(outId)!;
    const outPool = poolMap.get(outId);
    return {
      in: { id: inId, name: inPlayer.name, gwPoints: inPlayer.points },
      out: { id: outId, name: outPrev.name, gwPoints: outPool?.eventPoints ?? 0 },
    };
  });
}

export function computeWhatIfScore(
  actualGwPoints: number,
  transferPairs: TransferPair[],
  transferCost: number
): number {
  const inTotal = transferPairs.reduce((sum, t) => sum + t.in.gwPoints, 0);
  const outTotal = transferPairs.reduce((sum, t) => sum + t.out.gwPoints, 0);
  return actualGwPoints - inTotal + outTotal + transferCost;
}

export type PlayerPointsClass = 'great' | 'good' | 'neutral' | 'bad';

export function getPlayerPointsClass(pts: number): PlayerPointsClass {
  if (pts >= 8) return 'great';
  if (pts >= 3) return 'good';
  if (pts >= 1) return 'neutral';
  return 'bad';
}

export function getStatLabel(stats: {
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  minutes: number;
  bonus: number;
  yellow_cards: number;
  red_cards: number;
}): string {
  if (stats.minutes === 0) return '0 mins';
  const parts: string[] = [];
  if (stats.goals_scored > 0)
    parts.push(stats.goals_scored > 1 ? `${stats.goals_scored} goals` : 'goal');
  if (stats.assists > 0)
    parts.push(stats.assists > 1 ? `${stats.assists} assists` : 'assist');
  if (stats.clean_sheets > 0 && stats.minutes >= 60) parts.push('clean sheet');
  if (stats.bonus > 0) parts.push(`+${stats.bonus} bonus`);
  if (stats.red_cards > 0) parts.push('red card');
  else if (stats.yellow_cards > 0) parts.push('yellow card');
  if (parts.length === 0) return `${stats.minutes} mins`;
  return parts.join(' + ');
}
