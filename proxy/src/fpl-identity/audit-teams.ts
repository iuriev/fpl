import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { parseCsv } from '../prediction/csv';
import { defaultDataDir } from '../prediction/ingest';
import { slugFromFd, slugFromVaastav } from '../prediction/team-names';
import type { AuditIssue, TeamRegistry, VaastavTeamRow } from './types';

const FD_SEASON_CODES: Record<string, string> = {
  '2023-24': '2324',
  '2024-25': '2425',
  '2025-26': '2526',
};

function parseDateUk(value: string): string | null {
  const [d, m, y] = value.split('/');
  if (!d || !m || !y) return null;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export async function auditTeams(
  season: string,
  teams: VaastavTeamRow[],
  mergedGwTeamIds: readonly number[],
  dataDir = defaultDataDir(),
): Promise<{ issues: AuditIssue[]; registry: TeamRegistry; fdMatchCount: number; fdTeamCount: number }> {
  const issues: AuditIssue[] = [];
  const byCode = new Map<number, VaastavTeamRow>();
  const idToCode = new Map<number, number>();
  const slugToCode = new Map<string, number>();

  for (const team of teams) {
    const prevId = idToCode.get(team.teamId);
    if (prevId !== undefined && prevId !== team.teamCode) {
      issues.push({
        severity: 'error',
        category: 'team',
        code: 'TEAM_ID_MULTI_CODE',
        message: `Team id ${team.teamId} maps to multiple team codes`,
        details: { teamId: team.teamId, codeA: prevId, codeB: team.teamCode },
      });
    }
    idToCode.set(team.teamId, team.teamCode);

    const prevTeam = byCode.get(team.teamCode);
    if (prevTeam && prevTeam.teamId !== team.teamId) {
      issues.push({
        severity: 'error',
        category: 'team',
        code: 'TEAM_CODE_MULTI_ID',
        message: `Team code ${team.teamCode} maps to multiple team ids`,
        details: {
          teamCode: team.teamCode,
          teamIdA: prevTeam.teamId,
          teamIdB: team.teamId,
          nameA: prevTeam.name,
          nameB: team.name,
        },
      });
    }
    byCode.set(team.teamCode, team);

    const slug = slugFromVaastav(team.name) ?? slugFromVaastav(team.shortName);
    if (!slug) {
      issues.push({
        severity: 'error',
        category: 'team',
        code: 'TEAM_UNMAPPED_SLUG',
        message: `FPL team "${team.name}" (${team.teamId}) has no slug mapping`,
        details: { teamId: team.teamId, teamCode: team.teamCode, name: team.name },
      });
    } else {
      const existing = slugToCode.get(slug);
      if (existing !== undefined && existing !== team.teamCode) {
        issues.push({
          severity: 'error',
          category: 'cross-source',
          code: 'SLUG_MULTI_TEAM_CODE',
          message: `Slug "${slug}" maps to multiple team codes`,
          details: { slug, teamCodeA: existing, teamCodeB: team.teamCode },
        });
      }
      slugToCode.set(slug, team.teamCode);
    }
  }

  const mergedUnique = new Set(mergedGwTeamIds);
  for (const teamId of mergedUnique) {
    if (!idToCode.has(teamId)) {
      issues.push({
        severity: 'error',
        category: 'team',
        code: 'MERGED_GW_UNKNOWN_TEAM',
        message: `merged_gw team id ${teamId} missing from teams.csv`,
        details: { teamId },
      });
    }
  }

  const masterPath = join(dataDir, 'vaastav', 'master_team_list.csv');
  let masterText: string;
  try {
    masterText = await readFile(masterPath, 'utf8');
  } catch {
    issues.push({
      severity: 'warning',
      category: 'team',
      code: 'MASTER_TEAM_LIST_MISSING',
      message: 'master_team_list.csv not found — run research/pred-09/scripts/download-data.sh',
    });
    masterText = '';
  }

  for (const r of parseCsv(masterText)) {
    if (r.season !== season) continue;
    const teamId = Number(r.team);
    const slug = slugFromVaastav(r.team_name);
    if (!slug) {
      issues.push({
        severity: 'error',
        category: 'team',
        code: 'MASTER_LIST_UNMAPPED_SLUG',
        message: `master_team_list team "${r.team_name}" has no slug`,
        details: { teamId, teamName: r.team_name },
      });
      continue;
    }
    const fplCode = idToCode.get(teamId);
    if (fplCode === undefined) {
      issues.push({
        severity: 'warning',
        category: 'team',
        code: 'MASTER_LIST_UNKNOWN_TEAM_ID',
        message: `master_team_list team id ${teamId} (${r.team_name}) not in teams.csv`,
        details: { teamId, teamName: r.team_name },
      });
      continue;
    }
    const existingSlugCode = slugToCode.get(slug);
    if (existingSlugCode !== undefined && existingSlugCode !== fplCode) {
      issues.push({
        severity: 'error',
        category: 'cross-source',
        code: 'MASTER_SLUG_TEAM_MISMATCH',
        message: `Slug "${slug}" from master list conflicts with teams.csv`,
        details: { slug, masterTeamId: teamId, slugTeamCode: existingSlugCode, idTeamCode: fplCode },
      });
    }
  }

  const fdCode = FD_SEASON_CODES[season];
  let fdMatchCount = 0;
  const fdTeams = new Set<string>();
  const reportedFdSlugs = new Set<string>();
  if (fdCode) {
    const fdPath = join(dataDir, 'football-data', `E0_${fdCode}.csv`);
    let fdText: string;
    try {
      fdText = await readFile(fdPath, 'latin1' as BufferEncoding);
    } catch {
      issues.push({
        severity: 'warning',
        category: 'cross-source',
        code: 'FOOTBALL_DATA_MISSING',
        message: `football-data E0_${fdCode}.csv not found`,
      });
      fdText = '';
    }

    for (const r of parseCsv(fdText)) {
      const matchDate = parseDateUk(r.Date);
      if (!matchDate) continue;
      fdMatchCount++;
      for (const name of [r.HomeTeam, r.AwayTeam]) {
        if (!name) continue;
        fdTeams.add(name);
        const slug = slugFromFd(name);
        if (!slug) {
          issues.push({
            severity: 'error',
            category: 'cross-source',
            code: 'FD_UNMAPPED_TEAM',
            message: `football-data team "${name}" has no slug mapping`,
            details: { fdName: name },
          });
          continue;
        }
        if (!slugToCode.has(slug)) {
          if (reportedFdSlugs.has(slug)) continue;
          reportedFdSlugs.add(slug);
          issues.push({
            severity: 'error',
            category: 'cross-source',
            code: 'FD_SLUG_NO_FPL_TEAM',
            message: `football-data slug "${slug}" (${name}) has no FPL team in ${season}`,
            details: { slug, fdName: name },
          });
        }
      }
    }
  }

  const registry: TeamRegistry = {
    byCode: new Map(
      [...byCode.entries()].map(([code, t]) => [
        code,
        {
          teamId: t.teamId,
          name: t.name,
          shortName: t.shortName,
          slug: slugFromVaastav(t.name) ?? slugFromVaastav(t.shortName) ?? null,
        },
      ]),
    ),
    idToCode,
    slugToCode,
  };

  return { issues, registry, fdMatchCount, fdTeamCount: fdTeams.size };
}
