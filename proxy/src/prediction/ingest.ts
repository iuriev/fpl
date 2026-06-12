import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as DbSchema from '../db/schema';
import {
  predEplMatch,
  predPlayerGwFact,
  predTeamAlias,
} from '../db/schema';
import { loadIdentityMapper } from '../fpl-identity/load-mapper';
import { resolveFdTeamSlug } from '../fpl-identity/team-slug-lookup';
import { parseCsv } from './csv';
import type { EplMatchRow, PlayerGwFactRow } from './types';

const VAASTAV_BASE =
  'https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/data';

const FD_CODES: Record<string, string> = {
  '2019-20': '1920',
  '2020-21': '2021',
  '2021-22': '2122',
  '2022-23': '2223',
  '2023-24': '2324',
  '2024-25': '2425',
};

export function defaultDataDir(): string {
  const here = fileURLToPath(new URL('.', import.meta.url));
  return process.env.PRED_DATA_DIR ?? join(here, '../data/pred');
}

function parseDateUk(value: string): string | null {
  const [d, m, y] = value.split('/');
  if (!d || !m || !y) return null;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export async function loadEplMatchesFromDisk(
  dataDir = defaultDataDir(),
): Promise<EplMatchRow[]> {
  const seasonMappers = new Map<string, Awaited<ReturnType<typeof loadIdentityMapper>>>();
  for (const season of Object.keys(FD_CODES)) {
    try {
      seasonMappers.set(season, await loadIdentityMapper(season, dataDir));
    } catch {
      // vaastav snapshot unavailable for this season — FD slugs are not validated
    }
  }

  const rows: EplMatchRow[] = [];
  for (const [season, code] of Object.entries(FD_CODES)) {
    const path = join(dataDir, 'football-data', `E0_${code}.csv`);
    let text: string;
    try {
      text = await readFile(path, 'latin1' as BufferEncoding);
    } catch {
      continue;
    }
    const mapper = seasonMappers.get(season);
    for (const r of parseCsv(text)) {
      const homeSlug = resolveFdTeamSlug(r.HomeTeam, mapper);
      const awaySlug = resolveFdTeamSlug(r.AwayTeam, mapper);
      const matchDate = parseDateUk(r.Date);
      if (!homeSlug || !awaySlug || !matchDate) continue;
      rows.push({
        season,
        matchDate,
        homeSlug,
        awaySlug,
        fthg: Number(r.FTHG),
        ftag: Number(r.FTAG),
        ftr: r.FTR,
        referee: r.Referee || undefined,
        homeShots: r.HS ? Number(r.HS) : undefined,
        awayShots: r.AS ? Number(r.AS) : undefined,
        oddsHome: r.B365H ? Number(r.B365H) : undefined,
        oddsDraw: r.B365D ? Number(r.B365D) : undefined,
        oddsAway: r.B365A ? Number(r.B365A) : undefined,
        oddsOver25: r['B365>2.5'] ? Number(r['B365>2.5']) : undefined,
        oddsUnder25: r['B365<2.5'] ? Number(r['B365<2.5']) : undefined,
      });
    }
  }
  return rows;
}

export async function loadMergedGwFromDisk(
  season: string,
  dataDir = defaultDataDir(),
): Promise<PlayerGwFactRow[]> {
  const path = join(dataDir, 'vaastav', season, 'gws', 'merged_gw.csv');
  const text = await readFile(path, 'utf8');
  const rows: PlayerGwFactRow[] = [];
  for (const r of parseCsv(text)) {
    const round = Number(r.GW ?? r.round);
    const element = Number(r.element);
    if (!round || !element) continue;
    const teamRaw = r.team;
    const teamId = /^\d+$/.test(teamRaw) ? Number(teamRaw) : undefined;
    const teamName = teamId === undefined ? teamRaw : undefined;
    rows.push({
      season,
      round,
      element,
      fixture: Number(r.fixture) || 0,
      teamId,
      teamName,
      position: r.position,
      minutes: Number(r.minutes) || 0,
      starts: Number(r.starts) || 0,
      goals: Number(r.goals_scored) || 0,
      assists: Number(r.assists) || 0,
      totalPoints: Number(r.total_points) || 0,
      xp: Number(r.xP) || 0,
      expectedGoals: Number(r.expected_goals) || 0,
      expectedAssists: Number(r.expected_assists) || 0,
      defensiveContribution: r.defensive_contribution
        ? Number(r.defensive_contribution)
        : undefined,
      bonus: Number(r.bonus) || 0,
      yellowCards: Number(r.yellow_cards) || 0,
      saves: Number(r.saves) || 0,
      cleanSheets: Number(r.clean_sheets) || 0,
      opponentTeam: Number(r.opponent_team),
      wasHome: r.was_home === 'True' || r.was_home === 'true',
    });
  }
  return rows;
}

export async function ingestTeamAlias(
  db: PostgresJsDatabase<typeof DbSchema>,
  dataDir = defaultDataDir(),
): Promise<number> {
  const aliasSeason = '2023-24';
  const mapper = await loadIdentityMapper(aliasSeason, dataDir);
  const path = join(dataDir, 'vaastav', 'master_team_list.csv');
  const text = await readFile(path, 'utf8');
  let count = 0;
  for (const r of parseCsv(text)) {
    if (r.season !== aliasSeason) continue;
    const teamId = Number(r.team);
    let slug: string;
    try {
      slug = mapper.teamSlug(teamId);
    } catch {
      continue;
    }
    await db
      .insert(predTeamAlias)
      .values({
        slug,
        fplTeamId: Number(r.team),
        fdName: r.team_name,
        vaastavName: r.team_name,
      })
      .onConflictDoUpdate({
        target: predTeamAlias.slug,
        set: {
          fplTeamId: Number(r.team),
          fdName: r.team_name,
          vaastavName: r.team_name,
        },
      });
    count++;
  }
  return count;
}

export async function ingestEplMatches(
  db: PostgresJsDatabase<typeof DbSchema>,
  matches: EplMatchRow[],
): Promise<number> {
  const BATCH = 200;
  for (let i = 0; i < matches.length; i += BATCH) {
    const chunk = matches.slice(i, i + BATCH).map((m) => ({
      season: m.season,
      matchDate: m.matchDate,
      homeSlug: m.homeSlug,
      awaySlug: m.awaySlug,
      fthg: m.fthg,
      ftag: m.ftag,
      ftr: m.ftr,
      referee: m.referee ?? null,
      homeShots: m.homeShots ?? null,
      awayShots: m.awayShots ?? null,
      oddsHome: m.oddsHome ?? null,
      oddsDraw: m.oddsDraw ?? null,
      oddsAway: m.oddsAway ?? null,
      oddsOver25: m.oddsOver25 ?? null,
      oddsUnder25: m.oddsUnder25 ?? null,
    }));
    await db
      .insert(predEplMatch)
      .values(chunk)
      .onConflictDoUpdate({
        target: [
          predEplMatch.season,
          predEplMatch.matchDate,
          predEplMatch.homeSlug,
        ],
        set: {
          fthg: sql`excluded.fthg`,
          ftag: sql`excluded.ftag`,
          oddsHome: sql`excluded.odds_home`,
          ingestedAt: new Date(),
        },
      });
  }
  return matches.length;
}

function dedupePlayerGwFacts(facts: PlayerGwFactRow[]): PlayerGwFactRow[] {
  const byKey = new Map<string, PlayerGwFactRow>();
  for (const f of facts) {
    const key = `${f.season}|${f.round}|${f.element}|${f.fixture}`;
    byKey.set(key, f);
  }
  return [...byKey.values()];
}

export async function ingestPlayerGwFacts(
  db: PostgresJsDatabase<typeof DbSchema>,
  facts: PlayerGwFactRow[],
): Promise<number> {
  const unique = dedupePlayerGwFacts(facts);
  const BATCH = 2000;
  for (let i = 0; i < unique.length; i += BATCH) {
    const chunk = unique.slice(i, i + BATCH).map((f) => ({
      season: f.season,
      round: f.round,
      element: f.element,
      fixture: f.fixture,
      teamId: f.teamId ?? null,
      position: f.position,
      minutes: f.minutes,
      starts: f.starts,
      goals: f.goals,
      assists: f.assists,
      totalPoints: f.totalPoints,
      xp: f.xp,
      expectedGoals: f.expectedGoals,
      expectedAssists: f.expectedAssists,
      defensiveContribution: f.defensiveContribution ?? null,
      bonus: f.bonus ?? 0,
      yellowCards: f.yellowCards ?? 0,
      saves: f.saves ?? 0,
      cleanSheets: f.cleanSheets ?? 0,
    }));
    await db
      .insert(predPlayerGwFact)
      .values(chunk)
      .onConflictDoUpdate({
        target: [
          predPlayerGwFact.season,
          predPlayerGwFact.round,
          predPlayerGwFact.element,
          predPlayerGwFact.fixture,
        ],
        set: {
          totalPoints: sql`excluded.total_points`,
          xp: sql`excluded.xp`,
          expectedGoals: sql`excluded.expected_goals`,
          bonus: sql`excluded.bonus`,
          yellowCards: sql`excluded.yellow_cards`,
          saves: sql`excluded.saves`,
          cleanSheets: sql`excluded.clean_sheets`,
          ingestedAt: new Date(),
        },
      });
  }
  return unique.length;
}

export async function fetchMergedGwRemote(season: string): Promise<PlayerGwFactRow[]> {
  const url = `${VAASTAV_BASE}/${season}/gws/merged_gw.csv`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const text = await res.text();
  const rows: PlayerGwFactRow[] = [];
  for (const r of parseCsv(text)) {
    const round = Number(r.GW ?? r.round);
    const element = Number(r.element);
    if (!round || !element) continue;
    const teamRaw = r.team;
    const teamId = /^\d+$/.test(teamRaw) ? Number(teamRaw) : undefined;
    rows.push({
      season,
      round,
      element,
      fixture: Number(r.fixture) || 0,
      teamId,
      teamName: teamId === undefined ? teamRaw : undefined,
      position: r.position,
      minutes: Number(r.minutes) || 0,
      starts: Number(r.starts) || 0,
      goals: Number(r.goals_scored) || 0,
      assists: Number(r.assists) || 0,
      totalPoints: Number(r.total_points) || 0,
      xp: Number(r.xP) || 0,
      expectedGoals: Number(r.expected_goals) || 0,
      expectedAssists: Number(r.expected_assists) || 0,
      defensiveContribution: r.defensive_contribution
        ? Number(r.defensive_contribution)
        : undefined,
      bonus: Number(r.bonus) || 0,
      yellowCards: Number(r.yellow_cards) || 0,
      saves: Number(r.saves) || 0,
      cleanSheets: Number(r.clean_sheets) || 0,
      opponentTeam: Number(r.opponent_team),
      wasHome: r.was_home === 'True' || r.was_home === 'true',
    });
  }
  return rows;
}
