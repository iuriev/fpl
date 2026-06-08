import { describe, expect, it } from 'vitest';

import { parseCsv } from './csv';

describe('parseCsv', () => {
  it('parses quoted fields containing commas', () => {
    const rows = parseCsv(
      'id,code,news,team,team_code,web_name\n' +
        '237,450541,"Half season loan to Carlisle United, expected back in January",8,31,Plange\n',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: '237',
      code: '450541',
      team: '8',
      team_code: '31',
      web_name: 'Plange',
    });
    expect(rows[0].news).toContain('Carlisle United');
  });

  it('parses unquoted simple rows', () => {
    const rows = parseCsv('a,b\n1,2\n3,4\n');
    expect(rows).toEqual([{ a: '1', b: '2' }, { a: '3', b: '4' }]);
  });
});
