import type { FPLBootstrapStatic } from './fpl-client';

export function activeSquadElements(
  bootstrap: FPLBootstrapStatic,
  teamId: number
): FPLBootstrapStatic['elements'] {
  return bootstrap.elements.filter(
    (el) => el.team === teamId && (el.minutes > 0 || el.total_points > 0)
  );
}

export function hotElementIdsPerTeam(
  bootstrap: FPLBootstrapStatic,
  perTeamLimit: number
): number[] {
  const ids = new Set<number>();
  for (const team of bootstrap.teams) {
    const squad = activeSquadElements(bootstrap, team.id)
      .filter((el) => el.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, perTeamLimit);
    for (const el of squad) ids.add(el.id);
  }
  return [...ids];
}

export function coldElementIds(
  bootstrap: FPLBootstrapStatic,
  hotIds: ReadonlySet<number>
): number[] {
  const ids = new Set<number>();
  for (const team of bootstrap.teams) {
    for (const el of activeSquadElements(bootstrap, team.id)) {
      if (!hotIds.has(el.id)) ids.add(el.id);
    }
  }
  return [...ids];
}

export function allActiveElementIds(bootstrap: FPLBootstrapStatic): number[] {
  const ids = new Set<number>();
  for (const team of bootstrap.teams) {
    for (const el of activeSquadElements(bootstrap, team.id)) {
      ids.add(el.id);
    }
  }
  return [...ids];
}
