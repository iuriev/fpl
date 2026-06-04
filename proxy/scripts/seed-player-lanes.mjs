import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../src/data/player-lanes.json');
const overridesPath = join(__dirname, 'player-lane-overrides.json');

const res = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
if (!res.ok) throw new Error(`bootstrap-static ${res.status}`);
const bootstrap = await res.json();

const teamShort = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
const manualByTeam = JSON.parse(readFileSync(overridesPath, 'utf8'));

function wideScore(el) {
  return (
    Number(el.creativity) +
    Number(el.threat) * 0.4 +
    Number(el.expected_assists) * 35 +
    el.assists * 10
  );
}

function centralDefScore(el) {
  return Number(el.defensive_contribution) + Number(el.influence) * 0.15;
}

function assignFlanks(players, count) {
  const sorted = [...players].sort((a, b) => wideScore(b) - wideScore(a));
  if (sorted.length < count + 1) return new Map();

  const median = wideScore(sorted[Math.floor(sorted.length / 2)]);
  const threshold = median * 1.12;
  const wide = sorted.filter((el) => wideScore(el) >= threshold).slice(0, count);
  if (wide.length < count) return new Map();

  wide.sort((a, b) => a.id - b.id);
  const lanes = new Map();
  lanes.set(String(wide[0].code), 'L');
  lanes.set(String(wide[wide.length - 1].code), 'R');
  return lanes;
}

function assignDefLanes(defs) {
  const lanes = new Map();
  const active = defs.filter((el) => el.minutes > 0 || el.total_points > 0);
  for (const el of active) lanes.set(String(el.code), 'C');

  const flanks = assignFlanks(active, 2);
  for (const [code, lane] of flanks) lanes.set(code, lane);

  const centralSorted = [...active].sort((a, b) => centralDefScore(b) - centralDefScore(a));
  for (const el of centralSorted.slice(0, 2)) {
    lanes.set(String(el.code), 'C');
  }
  return lanes;
}

function assignMidFwdLanes(players, flankCount) {
  const lanes = new Map();
  const active = players.filter((el) => el.minutes > 0 || el.total_points > 0);
  for (const el of active) lanes.set(String(el.code), 'C');
  for (const [code, lane] of assignFlanks(active, flankCount)) lanes.set(code, lane);
  return lanes;
}

const lanes = {};

for (const el of bootstrap.elements) {
  if (el.minutes > 0 || el.total_points > 0) {
    lanes[String(el.code)] = 'C';
  }
}

const byTeam = new Map();
for (const el of bootstrap.elements) {
  if (!(el.minutes > 0 || el.total_points > 0)) continue;
  if (!byTeam.has(el.team)) byTeam.set(el.team, { 2: [], 3: [], 4: [] });
  const bucket = byTeam.get(el.team);
  if (el.element_type >= 2 && el.element_type <= 4) bucket[el.element_type].push(el);
}

for (const [teamId, groups] of byTeam) {
  for (const [code, lane] of assignDefLanes(groups[2])) lanes[code] = lane;
  for (const [code, lane] of assignMidFwdLanes(groups[3], 2)) lanes[code] = lane;
  for (const [code, lane] of assignMidFwdLanes(groups[4], 2)) lanes[code] = lane;
}

for (const el of bootstrap.elements) {
  const short = teamShort.get(el.team);
  const teamOverrides = manualByTeam[short];
  if (!teamOverrides) continue;
  const lane = teamOverrides[el.web_name];
  if (lane) lanes[String(el.code)] = lane;
}

writeFileSync(outPath, `${JSON.stringify(lanes, null, 0)}\n`);

const counts = { L: 0, C: 0, R: 0 };
for (const lane of Object.values(lanes)) counts[lane]++;
console.log(
  `Wrote ${Object.keys(lanes).length} player lanes to ${outPath} (L=${counts.L} C=${counts.C} R=${counts.R})`
);
