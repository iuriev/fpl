import { describe, expect, it } from 'vitest';

import { mapTransfermarktPosition } from './transfermarkt-position-map';

describe('mapTransfermarktPosition', () => {
  it('maps centre-back and right winger', () => {
    expect(mapTransfermarktPosition('Centre-Back')).toEqual({
      role: 'cb',
      lane: 'C',
      secondary: [],
    });
    expect(mapTransfermarktPosition('Right Winger')).toEqual({
      role: 'rw',
      lane: 'R',
      secondary: [],
    });
  });

  it('maps left and right midfield', () => {
    expect(mapTransfermarktPosition('Left Midfield')?.role).toBe('lm');
    expect(mapTransfermarktPosition('Right Midfield')?.role).toBe('rm');
  });
});
