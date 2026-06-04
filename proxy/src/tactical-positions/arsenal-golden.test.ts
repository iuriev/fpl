import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const rolesPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../data/player-tactical-roles.json'
);

describe('Arsenal tactical golden (after Transfermarkt ingest)', () => {
  it('has expected roles for key players when registry is populated', async () => {
    const roles = JSON.parse(readFileSync(rolesPath, 'utf8')) as Record<
      string,
      { role: string; lane: string }
    >;
    const bootstrap = await (
      await fetch('https://fantasy.premierleague.com/api/bootstrap-static/')
    ).json();
    const ars = bootstrap.teams.find((t: { short_name: string }) => t.short_name === 'ARS').id;
    const byName = (webName: string) => {
      const el = bootstrap.elements.find(
        (e: { team: number; web_name: string }) => e.team === ars && e.web_name === webName
      );
      return el ? roles[String(el.code)] : undefined;
    };

    const gabriel = byName('Gabriel');
    const saliba = byName('Saliba');
    const saka = byName('Saka');
    if (!gabriel || !saliba || !saka) return;

    expect(gabriel.role).toBe('cb');
    expect(gabriel.lane).toBe('C');
    expect(saliba.role).toBe('cb');
    expect(saliba.lane).toBe('C');
    expect(['rw', 'rm']).toContain(saka.role);
    expect(saka.lane).toBe('R');
  });
});
