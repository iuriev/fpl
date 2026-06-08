import { db } from '../db/client';
import { getOrFetchBootstrap } from '../fpl-cache/db-cache';
import { deriveSeason } from '../fpl-cache/season';
import type { FPLBootstrapStatic } from '../fpl-client';
import { identityMapperFromBootstrap } from './load-mapper';
import type { FplIdentityMapper } from './mapper';

let cached: { season: string; mapper: FplIdentityMapper } | null = null;

export function resetLiveMapperCacheForTests(): void {
  cached = null;
}

export async function getLiveIdentityMapper(
  bootstrap?: FPLBootstrapStatic,
): Promise<FplIdentityMapper> {
  const live = bootstrap ?? (await getOrFetchBootstrap(db));
  const season = deriveSeason(live.events);
  if (cached?.season === season) return cached.mapper;
  const mapper = identityMapperFromBootstrap(live, season);
  cached = { season, mapper };
  return mapper;
}

export function elementIdToFplCode(
  bootstrap: FPLBootstrapStatic,
  elementId: number,
): number | undefined {
  return bootstrap.elements.find((e) => e.id === elementId)?.code;
}

export function fplCodeToElementId(
  bootstrap: FPLBootstrapStatic,
  fplCode: number,
): number | undefined {
  return bootstrap.elements.find((e) => e.code === fplCode)?.id;
}
