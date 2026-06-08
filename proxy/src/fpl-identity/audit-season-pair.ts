import { getBootstrapStatic } from '../fpl-client';
import { defaultDataDir } from '../prediction/ingest';
import { auditBootstrapSeasonIdentity } from './audit-bootstrap-season';
import { auditCrossSeasonIdentity } from './audit-cross-season';
import { auditSeasonIdentity } from './audit-season';
import type { CrossSeasonAuditResult, SeasonAuditResult } from './types';

export type SeasonSource = 'vaastav' | 'bootstrap';

export async function loadSeasonAudit(
  season: string,
  dataDir = defaultDataDir(),
  source: SeasonSource = 'vaastav',
): Promise<SeasonAuditResult> {
  if (source === 'bootstrap') {
    const bootstrap = await getBootstrapStatic();
    return auditBootstrapSeasonIdentity(bootstrap, season, dataDir);
  }
  return auditSeasonIdentity(season, dataDir);
}

export async function auditSeasonPair(
  seasonA: string,
  seasonB: string,
  dataDir = defaultDataDir(),
  options: {
    seasonASource?: SeasonSource;
    seasonBSource?: SeasonSource;
  } = {},
): Promise<{
  seasonA: SeasonAuditResult;
  seasonB: SeasonAuditResult;
  crossSeason: CrossSeasonAuditResult;
}> {
  const seasonASource = options.seasonASource ?? 'vaastav';
  const seasonBSource = options.seasonBSource ?? 'vaastav';

  const [resultA, resultB] = await Promise.all([
    loadSeasonAudit(seasonA, dataDir, seasonASource),
    loadSeasonAudit(seasonB, dataDir, seasonBSource),
  ]);

  const crossSeason = auditCrossSeasonIdentity(
    seasonA,
    seasonB,
    resultA.playerRegistry,
    resultA.teamRegistry,
    resultB.playerRegistry,
    resultB.teamRegistry,
  );

  return { seasonA: resultA, seasonB: resultB, crossSeason };
}
