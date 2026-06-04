import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../src/data/player-tactical-roles.json');
const overridesPath = join(__dirname, 'player-tactical-role-overrides.json');

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

function pivotMidScore(el) {
  return Number(el.defensive_contribution) * 1.2 + Number(el.influence) * 0.1;
}

function assignFlankLanes(players, count) {
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

function profile(role, lane, secondary = []) {
  return { role, lane, secondary };
}

function assignDefRoles(defs) {
  const profiles = new Map();
  const active = defs.filter((el) => el.minutes > 0 || el.total_points > 0);
  for (const el of active) {
    profiles.set(String(el.code), profile('cb', 'C'));
  }

  const flankLanes = assignFlankLanes(active, 2);
  for (const [code, lane] of flankLanes) {
    const role = lane === 'L' ? 'lb' : 'rb';
    profiles.set(code, profile(role, lane, ['cb']));
  }

  const centralSorted = [...active].sort((a, b) => centralDefScore(b) - centralDefScore(a));
  for (const el of centralSorted.slice(0, 2)) {
    const code = String(el.code);
    const cur = profiles.get(code);
    if (cur?.role === 'lb' || cur?.role === 'rb') continue;
    profiles.set(code, profile('cb', 'C', ['lb', 'rb']));
  }

  return profiles;
}

function assignMidRoles(mids) {
  const profiles = new Map();
  const active = mids.filter((el) => el.minutes > 0 || el.total_points > 0);
  const flankLanes = assignFlankLanes(active, 2);

  for (const el of active) {
    const code = String(el.code);
    if (flankLanes.has(code)) {
      const lane = flankLanes.get(code);
      const role = lane === 'L' ? 'lm' : 'rm';
      profiles.set(code, profile(role, lane, ['cm', 'am']));
      continue;
    }
    const pivot = pivotMidScore(el);
    const wide = wideScore(el);
    const role = pivot >= wide * 0.85 ? 'dm' : 'cm';
    profiles.set(code, profile(role, 'C', role === 'dm' ? ['cm'] : ['dm', 'am']));
  }

  const byThreat = [...active].sort((a, b) => Number(b.threat) - Number(a.threat));
  if (byThreat[0]) {
    const top = String(byThreat[0].code);
    const cur = profiles.get(top);
    if (cur && (cur.role === 'cm' || cur.role === 'dm')) {
      profiles.set(top, profile('am', 'C', ['cm', 'lm', 'rm']));
    }
  }

  return profiles;
}

function assignFwdRoles(fwds) {
  const profiles = new Map();
  const active = fwds.filter((el) => el.minutes > 0 || el.total_points > 0);
  const flankLanes = assignFlankLanes(active, 2);
  for (const el of active) {
    const code = String(el.code);
    if (flankLanes.has(code)) {
      const lane = flankLanes.get(code);
      const role = lane === 'L' ? 'lw' : 'rw';
      profiles.set(code, profile(role, lane, ['st']));
    } else {
      profiles.set(code, profile('st', 'C', ['lw', 'rw']));
    }
  }
  return profiles;
}

const profiles = {};

for (const el of bootstrap.elements) {
  if (!(el.minutes > 0 || el.total_points > 0)) continue;
  if (el.element_type === 1) {
    profiles[String(el.code)] = profile('gk', 'C');
  }
}

const byTeam = new Map();
for (const el of bootstrap.elements) {
  if (!(el.minutes > 0 || el.total_points > 0)) continue;
  if (!byTeam.has(el.team)) byTeam.set(el.team, { 2: [], 3: [], 4: [] });
  const bucket = byTeam.get(el.team);
  if (el.element_type >= 2 && el.element_type <= 4) bucket[el.element_type].push(el);
}

for (const [, groups] of byTeam) {
  for (const [code, p] of assignDefRoles(groups[2])) profiles[code] = p;
  for (const [code, p] of assignMidRoles(groups[3])) profiles[code] = p;
  for (const [code, p] of assignFwdRoles(groups[4])) profiles[code] = p;
}

for (const el of bootstrap.elements) {
  const short = teamShort.get(el.team);
  const teamOverrides = manualByTeam[short];
  if (!teamOverrides) continue;
  const override = teamOverrides[el.web_name];
  if (override) {
    profiles[String(el.code)] = {
      role: override.role,
      lane:
        override.lane ??
        (override.role === 'lb' ||
        override.role === 'lm' ||
        override.role === 'lw'
          ? 'L'
          : override.role === 'rb' ||
              override.role === 'rm' ||
              override.role === 'rw'
            ? 'R'
            : 'C'),
      secondary: override.secondary ?? [],
    };
  }
}

writeFileSync(outPath, `${JSON.stringify(profiles, null, 0)}\n`);

const roleCounts = {};
for (const { role } of Object.values(profiles)) {
  roleCounts[role] = (roleCounts[role] ?? 0) + 1;
}
console.log(
  `Wrote ${Object.keys(profiles).length} tactical profiles to ${outPath}`,
  roleCounts
);
