import { describe, expect, it } from 'vitest';

import { attachFplCodes } from './player-code-map';

describe('attachFplCodes', () => {
  it('drops rows without a season element→code mapping', () => {
    const map = new Map([
      [331, 111111],
      [395, 222222],
    ]);
    const rows = attachFplCodes(
      [
        { seasonElementId: 331, x: 1 },
        { seasonElementId: 999, x: 2 },
        { seasonElementId: 395, x: 3 },
      ],
      map,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ seasonElementId: 331, fplCode: 111111 });
    expect(rows[1]).toMatchObject({ seasonElementId: 395, fplCode: 222222 });
  });
});
