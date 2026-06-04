import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { parseCsv } from './csv';
import { defaultDataDir } from './ingest';

const VAASTAV_BASE =
  'https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/data';

export async function loadElementToFplCode(
  season: string,
  dataDir = defaultDataDir(),
): Promise<Map<number, number>> {
  const path = join(dataDir, 'vaastav', season, 'players_raw.csv');
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch {
    const url = `${VAASTAV_BASE}/${season}/players_raw.csv`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `Missing players_raw for ${season}. Run research/pred-09/scripts/download-data.sh`,
      );
    }
    text = await res.text();
  }

  const map = new Map<number, number>();
  for (const r of parseCsv(text)) {
    const element = Number(r.id ?? r.element);
    const code = Number(r.code);
    if (!element || !code) continue;
    map.set(element, code);
  }
  return map;
}

export function attachFplCodes<T extends { seasonElementId: number }>(
  rows: T[],
  elementToCode: Map<number, number>,
): (T & { fplCode: number })[] {
  const out: (T & { fplCode: number })[] = [];
  for (const row of rows) {
    const fplCode = elementToCode.get(row.seasonElementId);
    if (fplCode === undefined) continue;
    out.push({ ...row, fplCode });
  }
  return out;
}
