import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { parseTransfermarktSquadHtml } from './scrape-transfermarkt-squad';

const fixtureDir = dirname(fileURLToPath(import.meta.url));

describe('parseTransfermarktSquadHtml', () => {
  it('parses centre-back and right winger from squad row snippet', () => {
    const snippet = readFileSync(join(fixtureDir, 'fixtures/squad-row-snippet.html'), 'utf8');
    const html = `<table>${snippet}</table>`;
    const squad = parseTransfermarktSquadHtml(html);
    expect(squad.find((p) => p.name.includes('Saliba'))).toMatchObject({
      position: 'Centre-Back',
      shirtNumber: 2,
    });
    expect(squad.find((p) => p.name.includes('Saka'))).toMatchObject({
      position: 'Right Winger',
      shirtNumber: 7,
    });
  });
});
