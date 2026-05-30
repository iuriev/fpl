import * as cacheLayer from './cache';
import type { FPLBootstrapStatic } from './fpl-client';
import * as fplClient from './fpl-client';
import type { FixtureInfo } from './types';
import { MAX_GAMEWEEK } from './types';

async function getBootstrapWithCache(): Promise<FPLBootstrapStatic> {
  const cached = cacheLayer.get<FPLBootstrapStatic>('bootstrap-static');
  if (cached) return cached;
  const bootstrap = await fplClient.getBootstrapStatic();
  cacheLayer.set('bootstrap-static', bootstrap, cacheLayer.ttl.BOOTSTRAP);
  return bootstrap;
}

function resolveNextGw(bootstrap: FPLBootstrapStatic): number {
  const next = bootstrap.events.find((e) => e.is_next);
  if (next) return next.id;
  const current = bootstrap.events.find((e) => e.is_current);
  if (current) return Math.min(current.id + 1, MAX_GAMEWEEK);
  const finished = bootstrap.events.filter((e) => e.finished);
  return finished.length > 0
    ? Math.min(finished[finished.length - 1].id + 1, MAX_GAMEWEEK)
    : 1;
}

export async function getUpcomingFixtures(): Promise<Record<number, FixtureInfo[]>> {
  const cacheKey = 'fixtures:upcoming';
  const cached = cacheLayer.get<Record<number, FixtureInfo[]>>(cacheKey);
  if (cached) return cached;

  const bootstrap = await getBootstrapWithCache();
  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
  const nextGw = resolveNextGw(bootstrap);
  const gwIds = [nextGw, nextGw + 1, nextGw + 2].filter((id) => id <= MAX_GAMEWEEK);

  const allFixtures = await Promise.all(gwIds.map((gw) => fplClient.getFixtures(gw)));

  const result: Record<number, FixtureInfo[]> = {};
  for (let i = 0; i < gwIds.length; i++) {
    const gw = gwIds[i];
    for (const fixture of allFixtures[i]) {
      if (!result[fixture.team_h]) result[fixture.team_h] = [];
      if (!result[fixture.team_a]) result[fixture.team_a] = [];
      result[fixture.team_h].push({
        gw,
        opponent: teamMap.get(fixture.team_a) ?? '???',
        home: true,
        difficulty: fixture.team_h_difficulty as 1 | 2 | 3 | 4 | 5,
      });
      result[fixture.team_a].push({
        gw,
        opponent: teamMap.get(fixture.team_h) ?? '???',
        home: false,
        difficulty: fixture.team_a_difficulty as 1 | 2 | 3 | 4 | 5,
      });
    }
  }

  cacheLayer.set(cacheKey, result, cacheLayer.ttl.FIXTURES);
  return result;
}
