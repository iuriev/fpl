export type RankDirection = 'up' | 'down' | 'neutral';

export function getRankDirection(currentRank: number, previousRank: number | undefined): RankDirection {
  if (previousRank === undefined) return 'neutral';
  if (currentRank < previousRank) return 'up';
  if (currentRank > previousRank) return 'down';
  return 'neutral';
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-GB');
}

export function formatValue(teamValue: number): string {
  return teamValue.toFixed(1);
}
