import { crossSeasonPlayerMatch } from './match-names';
import type { AuditIssue, CrossSeasonAuditResult, PlayerRegistry, TeamRegistry } from './types';

function auditPlayerCodesAcrossSeasons(
  seasonA: string,
  seasonB: string,
  registryA: PlayerRegistry,
  registryB: PlayerRegistry,
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const codesA = new Set(registryA.byCode.keys());
  const codesB = new Set(registryB.byCode.keys());

  for (const fplCode of codesA) {
    if (!codesB.has(fplCode)) continue;
    const entryA = registryA.byCode.get(fplCode)!;
    const entryB = registryB.byCode.get(fplCode)!;
    if (!crossSeasonPlayerMatch(entryA, entryB)) {
      issues.push({
        severity: 'error',
        category: 'cross-season',
        code: 'CODE_PLAYER_IDENTITY_CONFLICT',
        message: `Fpl code ${fplCode} maps to different players in ${seasonA} vs ${seasonB}`,
        details: {
          fplCode,
          seasonA,
          seasonB,
          webNameA: entryA.webName,
          webNameB: entryB.webName,
          elementIdA: entryA.elementId,
          elementIdB: entryB.elementId,
        },
      });
    }
  }

  return issues;
}

function auditTeamCodesAcrossSeasons(
  seasonA: string,
  seasonB: string,
  registryA: TeamRegistry,
  registryB: TeamRegistry,
): AuditIssue[] {
  const issues: AuditIssue[] = [];

  for (const teamCode of registryA.byCode.keys()) {
    const entryB = registryB.byCode.get(teamCode);
    if (!entryB) continue;
    const entryA = registryA.byCode.get(teamCode)!;
    const slugA = entryA.slug;
    const slugB = entryB.slug;
    if (slugA && slugB && slugA !== slugB) {
      issues.push({
        severity: 'error',
        category: 'cross-season',
        code: 'CODE_TEAM_IDENTITY_CONFLICT',
        message: `Team code ${teamCode} maps to different slugs in ${seasonA} vs ${seasonB}`,
        details: {
          teamCode,
          seasonA,
          seasonB,
          slugA,
          slugB,
          nameA: entryA.name,
          nameB: entryB.name,
        },
      });
    }
  }

  return issues;
}

export function auditCrossSeasonIdentity(
  seasonA: string,
  seasonB: string,
  registryA: PlayerRegistry,
  teamRegistryA: TeamRegistry,
  registryB: PlayerRegistry,
  teamRegistryB: TeamRegistry,
): CrossSeasonAuditResult {
  const issues = [
    ...auditPlayerCodesAcrossSeasons(seasonA, seasonB, registryA, registryB),
    ...auditTeamCodesAcrossSeasons(seasonA, seasonB, teamRegistryA, teamRegistryB),
  ];
  const codesA = registryA.byCode;
  const codesB = registryB.byCode;
  let both = 0;
  for (const code of codesA.keys()) {
    if (codesB.has(code)) both++;
  }

  let teamBoth = 0;
  for (const code of teamRegistryA.byCode.keys()) {
    if (teamRegistryB.byCode.has(code)) teamBoth++;
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  return {
    seasonA,
    seasonB,
    ok: errorCount === 0,
    errorCount,
    warningCount,
    issues,
    stats: {
      playerCodesA: codesA.size,
      playerCodesB: codesB.size,
      playerCodesBoth: both,
      teamCodesBoth: teamBoth,
      newPlayerCodesInB: codesB.size - both,
      departedPlayerCodes: codesA.size - both,
    },
  };
}
