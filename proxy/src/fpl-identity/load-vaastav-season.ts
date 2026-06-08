import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { parseCsv } from '../prediction/csv';
import { defaultDataDir } from '../prediction/ingest';
import { parseMergedGwCsv } from './merged-gw';
import type { VaastavPlayerRow, VaastavSeasonSnapshot, VaastavTeamRow } from './types';

const VAASTAV_BASE =
  'https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/data';

async function readVaastavFile(path: string, url: string): Promise<string> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Missing vaastav file: ${path} (${url})`);
    }
    return res.text();
  }
}

function parsePlayersRaw(text: string): VaastavPlayerRow[] {
  const rows: VaastavPlayerRow[] = [];
  for (const r of parseCsv(text)) {
    const elementId = Number(r.id ?? r.element);
    const fplCode = Number(r.code);
    const teamId = Number(r.team);
    const teamCode = Number(r.team_code);
    if (!elementId || !fplCode || !teamId || !teamCode) continue;
    rows.push({
      elementId,
      fplCode,
      webName: r.web_name ?? '',
      firstName: r.first_name ?? '',
      secondName: r.second_name ?? '',
      elementType: Number(r.element_type) || 0,
      teamId,
      teamCode,
    });
  }
  return rows;
}

function parseTeamsCsv(text: string): VaastavTeamRow[] {
  const rows: VaastavTeamRow[] = [];
  for (const r of parseCsv(text)) {
    const teamId = Number(r.id);
    const teamCode = Number(r.code);
    if (!teamId || !teamCode) continue;
    rows.push({
      teamId,
      teamCode,
      name: r.name ?? '',
      shortName: r.short_name ?? '',
    });
  }
  return rows;
}

function parseMergedGw(text: string) {
  return parseMergedGwCsv(text);
}

export async function loadVaastavSeason(
  season: string,
  dataDir = defaultDataDir(),
): Promise<VaastavSeasonSnapshot> {
  const base = join(dataDir, 'vaastav', season);
  const playersText = await readVaastavFile(
    join(base, 'players_raw.csv'),
    `${VAASTAV_BASE}/${season}/players_raw.csv`,
  );
  const teamsText = await readVaastavFile(
    join(base, 'teams.csv'),
    `${VAASTAV_BASE}/${season}/teams.csv`,
  );
  const mergedText = await readVaastavFile(
    join(base, 'gws', 'merged_gw.csv'),
    `${VAASTAV_BASE}/${season}/gws/merged_gw.csv`,
  );

  const merged = parseMergedGw(mergedText);
  return {
    season,
    players: parsePlayersRaw(playersText),
    teams: parseTeamsCsv(teamsText),
    mergedGwElementIds: merged.elementIds,
    mergedGwTeamIds: merged.teamIds,
    mergedGwRowCount: merged.rowCount,
    mergedGwElementNames: merged.elementNames,
    mergedGwNamesByElement: merged.namesByElement,
  };
}
