import { describe, expect, it } from 'vitest';

import playerLanes from './data/player-lanes.json';

describe('player-lanes.json', () => {
  it('includes L and R flank entries for active squads', () => {
    const values = Object.values(playerLanes);
    expect(values.length).toBeGreaterThan(100);
    expect(values.includes('L')).toBe(true);
    expect(values.includes('R')).toBe(true);
  });
});
