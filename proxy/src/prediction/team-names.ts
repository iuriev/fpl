export const FD_TO_SLUG: Record<string, string> = {
  Arsenal: 'arsenal',
  'Aston Villa': 'aston-villa',
  Bournemouth: 'bournemouth',
  Brentford: 'brentford',
  Brighton: 'brighton',
  Burnley: 'burnley',
  Chelsea: 'chelsea',
  'Crystal Palace': 'crystal-palace',
  Everton: 'everton',
  Fulham: 'fulham',
  Ipswich: 'ipswich',
  Leeds: 'leeds',
  Leicester: 'leicester',
  Liverpool: 'liverpool',
  Luton: 'luton',
  'Man City': 'man-city',
  'Man United': 'man-united',
  'Manchester City': 'man-city',
  'Manchester United': 'man-united',
  Newcastle: 'newcastle',
  "Nott'm Forest": 'nottm-forest',
  Norwich: 'norwich',
  'Sheffield United': 'sheffield-utd',
  Southampton: 'southampton',
  Spurs: 'spurs',
  Sunderland: 'sunderland',
  Tottenham: 'spurs',
  Watford: 'watford',
  'West Brom': 'west-brom',
  'West Ham': 'west-ham',
  Wolves: 'wolves',
};

export const VAASTAV_TO_SLUG: Record<string, string> = {
  Arsenal: 'arsenal',
  'Aston Villa': 'aston-villa',
  Bournemouth: 'bournemouth',
  Brentford: 'brentford',
  Brighton: 'brighton',
  Burnley: 'burnley',
  Chelsea: 'chelsea',
  'Crystal Palace': 'crystal-palace',
  Everton: 'everton',
  Fulham: 'fulham',
  Ipswich: 'ipswich',
  Leeds: 'leeds',
  Leicester: 'leicester',
  Liverpool: 'liverpool',
  Luton: 'luton',
  'Man City': 'man-city',
  'Man Utd': 'man-united',
  Newcastle: 'newcastle',
  "Nott'm Forest": 'nottm-forest',
  'Sheffield Utd': 'sheffield-utd',
  Southampton: 'southampton',
  Spurs: 'spurs',
  Sunderland: 'sunderland',
  Tottenham: 'spurs',
  Watford: 'watford',
  'West Brom': 'west-brom',
  'West Ham': 'west-ham',
  Wolves: 'wolves',
};

export function slugFromFd(name: string): string | undefined {
  return FD_TO_SLUG[name.trim()];
}

export function slugFromVaastav(name: string): string | undefined {
  return VAASTAV_TO_SLUG[name.trim()];
}

export function slugFromFplTeamName(name: string): string | undefined {
  return slugFromVaastav(name) ?? slugFromFd(name);
}

/** Audit/legacy only — prediction scoring uses `FplIdentityMapper.teamIdToSlugMap()`. */
export function buildFplTeamIdToSlug(
  teams: ReadonlyArray<{ id: number; name: string }>,
): Map<number, string> {
  const map = new Map<number, string>();
  for (const team of teams) {
    const slug = slugFromFplTeamName(team.name);
    if (slug) map.set(team.id, slug);
  }
  return map;
}

/** Audit/legacy only — prediction scoring uses `FplIdentityMapper.teamIdToSlugMap()`. */
export function mergeTeamIdToSlug(
  aliasRows: ReadonlyArray<{ fplTeamId: number; slug: string }>,
  bootstrapTeams: ReadonlyArray<{ id: number; name: string }>,
): Map<number, string> {
  const map = new Map(aliasRows.map((a) => [a.fplTeamId, a.slug]));
  for (const [id, slug] of buildFplTeamIdToSlug(bootstrapTeams)) {
    map.set(id, slug);
  }
  return map;
}

/** Audit/legacy only — prediction scoring uses `FplIdentityMapper.resolveTeamSlug()`. */
export function resolveTeamSlug(
  value: string | number,
  idToSlug: Map<number, string>,
): string | undefined {
  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    return idToSlug.get(Number(value));
  }
  return slugFromVaastav(String(value)) ?? slugFromFd(String(value));
}
