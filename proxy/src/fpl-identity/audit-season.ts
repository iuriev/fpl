import { auditPlayers } from './audit-players';
import { auditTeams } from './audit-teams';
import { loadVaastavSeason } from './load-vaastav-season';
import type { SeasonAuditResult } from './types';

export async function auditSeasonIdentity(
  season: string,
  dataDir?: string,
): Promise<SeasonAuditResult> {
  const snapshot = await loadVaastavSeason(season, dataDir);
  const playerAudit = auditPlayers(
    snapshot.players,
    snapshot.mergedGwElementIds,
    snapshot.mergedGwNamesByElement,
  );
  const teamAudit = await auditTeams(
    season,
    snapshot.teams,
    snapshot.mergedGwTeamIds,
    dataDir,
  );

  const issues = [...playerAudit.issues, ...teamAudit.issues];
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  return {
    season,
    source: 'vaastav',
    ok: errorCount === 0,
    errorCount,
    warningCount,
    issues,
    playerRegistry: playerAudit.registry,
    teamRegistry: teamAudit.registry,
    stats: {
      playersRaw: snapshot.players.length,
      teams: snapshot.teams.length,
      mergedGwRows: snapshot.mergedGwRowCount,
      mergedGwElements: new Set(snapshot.mergedGwElementIds).size,
      fdMatches: teamAudit.fdMatchCount,
      fdTeams: teamAudit.fdTeamCount,
    },
  };
}
