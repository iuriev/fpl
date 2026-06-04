import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { TacticalRole } from '../src/player-tactical-role.js';
import {
  type FplPlayerCandidate,
  matchFplPlayersToTm,
} from '../src/tactical-positions/match-fpl-player.js';
import {
  fetchTransfermarktSquad,
  sleep,
  type TmSquadPlayer,
} from '../src/tactical-positions/scrape-transfermarkt-squad.js';
import { mapTransfermarktPosition } from '../src/tactical-positions/transfermarkt-position-map.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const clubMapPath = join(repoRoot, 'data/transfermarkt/pl-club-ids.json');
const outPath = join(repoRoot, 'src/data/player-tactical-roles.json');
const reportDir = join(repoRoot, 'data/transfermarkt');
const manualOverridesPath = join(__dirname, 'player-tactical-role-overrides.json');

const DELAY_MS = Number(process.env.TM_INGEST_DELAY_MS ?? 4000);
const SEASON_ID = process.env.TM_SEASON_ID ?? '2025';
const clubFilter = process.argv.find((a) => a.startsWith('--club='))?.split('=')[1];

interface ClubMapEntry {
  shortName: string;
  slug: string;
  clubId: string;
}

interface FplElement {
  code: number;
  team: number;
  web_name: string;
  first_name: string;
  second_name: string;
  element_type: number;
  minutes: number;
  total_points: number;
  squad_number: number | null;
}

type ManualOverrides = Record<
  string,
  Record<string, { role: TacticalRole; lane?: 'L' | 'C' | 'R'; secondary?: TacticalRole[] }>
>;

function isActive(el: FplElement): boolean {
  return el.minutes > 0 || el.total_points > 0;
}

function laneForRole(role: TacticalRole, lane?: 'L' | 'C' | 'R') {
  if (lane) return lane;
  if (role === 'lb' || role === 'lm' || role === 'lw') return 'L';
  if (role === 'rb' || role === 'rm' || role === 'rw') return 'R';
  return 'C';
}

async function main(): Promise<void> {
  const clubMap = JSON.parse(readFileSync(clubMapPath, 'utf8')) as Record<
    string,
    ClubMapEntry
  >;
  const manualByTeam = JSON.parse(readFileSync(manualOverridesPath, 'utf8')) as ManualOverrides;

  const bootstrapRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
  if (!bootstrapRes.ok) throw new Error(`bootstrap-static ${bootstrapRes.status}`);
  const bootstrap = (await bootstrapRes.json()) as {
    teams: { id: number; short_name: string }[];
    elements: FplElement[];
  };

  const teamShort = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
  const profiles: Record<string, { role: TacticalRole; lane: 'L' | 'C' | 'R'; secondary: TacticalRole[] }> =
    {};
  const matchReport: Array<Record<string, unknown>> = [];
  const unmapped: Array<Record<string, unknown>> = [];
  const tmById = new Map<string, TmSquadPlayer>();

  const teamIds = Object.keys(clubMap).filter((id) => {
    if (!clubFilter) return true;
    return clubMap[id].shortName === clubFilter;
  });

  for (let i = 0; i < teamIds.length; i++) {
    const teamId = Number(teamIds[i]);
    const club = clubMap[String(teamId)];
    const short = teamShort.get(teamId) ?? club.shortName;
    console.log(`[${i + 1}/${teamIds.length}] ${short} — fetching Transfermarkt squad…`);

    const tmSquad = await fetchTransfermarktSquad(club.slug, club.clubId, SEASON_ID);
    for (const p of tmSquad) tmById.set(p.id, p);

    const fplPlayers = bootstrap.elements
      .filter((el) => el.team === teamId && isActive(el))
      .map(
        (el): FplPlayerCandidate => ({
          code: el.code,
          webName: el.web_name,
          firstName: el.first_name,
          secondName: el.second_name,
          squadNumber: el.squad_number,
        })
      );

    const { matched, unmatchedFpl } = matchFplPlayersToTm(
      fplPlayers,
      tmSquad.map((p) => ({
        id: p.id,
        name: p.name,
        shirtNumber: p.shirtNumber,
      }))
    );

    for (const m of matched) {
      const tm = tmSquad.find((p) => p.id === m.tmId)!;
      const mapped = mapTransfermarktPosition(
        tm.position,
        bootstrap.elements.find((e) => e.code === m.fplCode)?.element_type
      );
      if (!mapped) {
        unmapped.push({
          team: short,
          fplCode: m.fplCode,
          tmName: tm.name,
          tmPosition: tm.position,
          reason: 'unknown_tm_position',
        });
        continue;
      }
      profiles[String(m.fplCode)] = {
        role: mapped.role,
        lane: mapped.lane,
        secondary: mapped.secondary,
      };
      matchReport.push({
        team: short,
        fplCode: m.fplCode,
        tmId: m.tmId,
        tmName: tm.name,
        tmPosition: tm.position,
        role: mapped.role,
        lane: mapped.lane,
        method: m.method,
        confidence: m.confidence,
      });
    }

    for (const fpl of unmatchedFpl) {
      const el = bootstrap.elements.find((e) => e.code === fpl.code)!;
      const fallback = mapTransfermarktPosition('', el.element_type);
      if (fallback) {
        profiles[String(fpl.code)] = {
          role: fallback.role,
          lane: fallback.lane,
          secondary: fallback.secondary,
        };
        matchReport.push({
          team: short,
          fplCode: fpl.code,
          webName: fpl.webName,
          method: 'fpl_type_fallback',
          role: fallback.role,
          lane: fallback.lane,
        });
      } else {
        unmapped.push({
          team: short,
          fplCode: fpl.code,
          webName: fpl.webName,
          secondName: fpl.secondName,
          elementType: el.element_type,
          reason: 'no_tm_match',
        });
      }
    }

    if (i < teamIds.length - 1) await sleep(DELAY_MS);
  }

  for (const el of bootstrap.elements) {
    if (!isActive(el)) continue;
    const short = teamShort.get(el.team);
    const teamOverrides = short ? manualByTeam[short] : undefined;
    const override = teamOverrides?.[el.web_name];
    if (override) {
      profiles[String(el.code)] = {
        role: override.role,
        lane: laneForRole(override.role, override.lane),
        secondary: override.secondary ?? [],
      };
      matchReport.push({
        team: short,
        fplCode: el.code,
        webName: el.web_name,
        method: 'manual',
        role: override.role,
        lane: laneForRole(override.role, override.lane),
      });
    }
  }

  const lanesPath = join(repoRoot, 'src/data/player-lanes.json');
  const lanes: Record<string, 'L' | 'C' | 'R'> = {};
  for (const [code, prof] of Object.entries(profiles)) {
    lanes[code] = prof.lane;
  }

  mkdirSync(reportDir, { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(profiles, null, 0)}\n`);
  writeFileSync(lanesPath, `${JSON.stringify(lanes, null, 0)}\n`);
  writeFileSync(join(reportDir, 'match-report.json'), `${JSON.stringify(matchReport, null, 2)}\n`);
  writeFileSync(join(reportDir, 'unmapped.json'), `${JSON.stringify(unmapped, null, 2)}\n`);

  const roleCounts: Record<string, number> = {};
  for (const { role } of Object.values(profiles)) {
    roleCounts[role] = (roleCounts[role] ?? 0) + 1;
  }

  const matchedCount = Object.keys(profiles).length;
  const activeCount = bootstrap.elements.filter(isActive).length;
  console.log(
    `Wrote ${matchedCount} tactical profiles to ${outPath} (${unmapped.length} unmapped of ${activeCount} active)`
  );
  console.log(roleCounts);
}

await main();
