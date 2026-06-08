import { deriveSeason } from '../fpl-cache/season';
import type { FPLBootstrapStatic } from '../fpl-client';
import { defaultDataDir } from '../prediction/ingest';
import { auditPlayers } from './audit-players';
import { auditTeams } from './audit-teams';
import { loadMergedGwFromDisk } from './merged-gw';
import type { SeasonAuditResult, VaastavPlayerRow, VaastavTeamRow } from './types';

function bootstrapPlayers(bootstrap: FPLBootstrapStatic): VaastavPlayerRow[] {
  return bootstrap.elements.map((el) => ({
    elementId: el.id,
    fplCode: el.code,
    webName: el.web_name,
    firstName: el.first_name,
    secondName: el.second_name,
    elementType: el.element_type,
    teamId: el.team,
    teamCode: el.team_code,
  }));
}

function bootstrapTeams(bootstrap: FPLBootstrapStatic): VaastavTeamRow[] {
  return bootstrap.teams.map((t) => ({
    teamId: t.id,
    teamCode: t.code,
    name: t.name,
    shortName: t.short_name,
  }));
}

export async function auditBootstrapSeasonIdentity(
  bootstrap: FPLBootstrapStatic,
  season: string,
  dataDir = defaultDataDir(),
): Promise<SeasonAuditResult> {
  const derived = deriveSeason(bootstrap.events);
  const issues = [];
  if (derived !== season) {
    issues.push({
      severity: 'error' as const,
      category: 'cross-source' as const,
      code: 'BOOTSTRAP_SEASON_MISMATCH',
      message: `Bootstrap GW1 season is ${derived}, expected ${season}`,
      details: { expected: season, derived },
    });
  }

  const players = bootstrapPlayers(bootstrap);
  const teams = bootstrapTeams(bootstrap);
  const merged = await loadMergedGwFromDisk(season, dataDir);

  const playerAudit = auditPlayers(
    players,
    merged?.elementIds ?? [],
    merged?.namesByElement ?? new Map(),
  );
  const teamAudit = await auditTeams(season, teams, merged?.teamIds ?? [], dataDir);

  const allIssues = [...issues, ...playerAudit.issues, ...teamAudit.issues];
  const errorCount = allIssues.filter((i) => i.severity === 'error').length;
  const warningCount = allIssues.filter((i) => i.severity === 'warning').length;

  return {
    season,
    source: 'bootstrap',
    ok: errorCount === 0,
    errorCount,
    warningCount,
    issues: allIssues,
    playerRegistry: playerAudit.registry,
    teamRegistry: teamAudit.registry,
    stats: {
      playersRaw: players.length,
      teams: teams.length,
      mergedGwRows: merged?.rowCount ?? 0,
      mergedGwElements: merged ? new Set(merged.elementIds).size : 0,
      fdMatches: teamAudit.fdMatchCount,
      fdTeams: teamAudit.fdTeamCount,
    },
  };
}
