import { deriveSeason } from '../fpl-cache/season';
import type { FPLBootstrapStatic } from '../fpl-client';
import { getBootstrapStatic } from '../fpl-client';
import { defaultDataDir } from '../prediction/ingest';
import { auditBootstrapSeasonIdentity } from './audit-bootstrap-season';
import { auditSeasonIdentity } from './audit-season';
import { buildRegistriesFromBootstrap } from './build-registry';
import { auditFailedError } from './errors';
import { FplIdentityMapper } from './mapper';

export async function loadIdentityMapper(
  season: string,
  dataDir = defaultDataDir(),
): Promise<FplIdentityMapper> {
  const audit = await auditSeasonIdentity(season, dataDir);
  if (!audit.ok) {
    throw auditFailedError(season, audit.issues);
  }
  return new FplIdentityMapper(season, audit.playerRegistry, audit.teamRegistry);
}

export async function loadLiveIdentityMapper(
  season: string,
  bootstrap?: FPLBootstrapStatic,
  dataDir = defaultDataDir(),
): Promise<FplIdentityMapper> {
  const live = bootstrap ?? (await getBootstrapStatic());
  const resolvedSeason = deriveSeason(live.events);
  const auditSeason = season || resolvedSeason;
  const audit = await auditBootstrapSeasonIdentity(live, auditSeason, dataDir);
  if (!audit.ok) {
    throw auditFailedError(auditSeason, audit.issues);
  }
  return new FplIdentityMapper(auditSeason, audit.playerRegistry, audit.teamRegistry);
}

export function identityMapperFromBootstrap(
  bootstrap: FPLBootstrapStatic,
  season: string,
): FplIdentityMapper {
  const { playerRegistry, teamRegistry } = buildRegistriesFromBootstrap(bootstrap);
  return new FplIdentityMapper(season, playerRegistry, teamRegistry);
}
