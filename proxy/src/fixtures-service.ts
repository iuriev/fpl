import * as cacheLayer from './cache';
import type { FPLBootstrapStatic } from './fpl-client';
import * as fplClient from './fpl-client';
import { resolveNextGw } from './resolve-next-gw';
import type { FixtureInfo } from './types';
import { MAX_GAMEWEEK } from './types';

async function getBootstrapWithCache(): Promise<FPLBootstrapStatic> {
  const cached = cacheLayer.get<FPLBootstrapStatic>('bootstrap-static');
  if (cached) return cached;
  const bootstrap = await fplClient.getBootstrapStatic();
  cacheLayer.set('bootstrap-static', bootstrap, cacheLayer.ttl.BOOTSTRAP);
  return bootstrap;
}

export async function getUpcomingFixtures(): Promise<Record<number, FixtureInfo[]>> {
  const cacheKey = 'fixtures:upcoming';
  const cached = cacheLayer.get<Record<number, FixtureInfo[]>>(cacheKey);
  if (cached) return cached;

  const bootstrap = await getBootstrapWithCache();
  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
  const finishedGwIds = new Set(bootstrap.events.filter((e) => e.finished).map((e) => e.id));
  const nextGw = resolveNextGw(bootstrap);
  const gwIds = [nextGw, nextGw + 1, nextGw + 2].filter(
    (id) => id <= MAX_GAMEWEEK && !finishedGwIds.has(id)
  );

  if (gwIds.length === 0) {
    cacheLayer.set(cacheKey, {}, cacheLayer.ttl.FIXTURES);
    return {};
  }

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
