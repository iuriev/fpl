const PL_BADGES_CDN = 'https://resources.premierleague.com/premierleague/badges';

export function teamBadgeUrl(teamCode: number, size: 70 | 100 = 100): string {
  return `${PL_BADGES_CDN}/${size}/t${teamCode}.png`;
}
