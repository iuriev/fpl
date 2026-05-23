export type RankDirection = 'up' | 'down' | 'neutral';

export function getLeagueRankDirection(rank: number, lastRank: number | null): RankDirection {
  if (lastRank === null) return 'neutral';
  if (rank < lastRank) return 'up';
  if (rank > lastRank) return 'down';
  return 'neutral';
}

export function formatRank(rank: number): string {
  return rank.toLocaleString('en-GB');
}
