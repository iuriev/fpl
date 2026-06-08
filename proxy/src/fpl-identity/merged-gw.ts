import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { parseCsv } from '../prediction/csv';
import { defaultDataDir } from '../prediction/ingest';

export function parseMergedGwCsv(text: string): {
  elementIds: number[];
  teamIds: number[];
  rowCount: number;
  elementNames: Map<number, string>;
  namesByElement: Map<number, Set<string>>;
} {
  const elementIds: number[] = [];
  const teamIds: number[] = [];
  const elementNames = new Map<number, string>();
  const namesByElement = new Map<number, Set<string>>();
  let rowCount = 0;
  for (const r of parseCsv(text)) {
    const element = Number(r.element);
    const round = Number(r.GW ?? r.round);
    if (!element || !round) continue;
    rowCount++;
    elementIds.push(element);
    if (r.name) {
      if (!elementNames.has(element)) elementNames.set(element, r.name);
      const names = namesByElement.get(element) ?? new Set<string>();
      names.add(r.name);
      namesByElement.set(element, names);
    }
    const teamRaw = r.team;
    if (/^\d+$/.test(teamRaw)) {
      teamIds.push(Number(teamRaw));
    }
  }
  return { elementIds, teamIds, rowCount, elementNames, namesByElement };
}

export async function loadMergedGwFromDisk(
  season: string,
  dataDir = defaultDataDir(),
): Promise<ReturnType<typeof parseMergedGwCsv> | null> {
  const path = join(dataDir, 'vaastav', season, 'gws', 'merged_gw.csv');
  try {
    const text = await readFile(path, 'utf8');
    return parseMergedGwCsv(text);
  } catch {
    return null;
  }
}
