import { describe, expect, it, vi } from 'vitest';

vi.mock('./data/player-lanes.json', () => ({
  default: { '100': 'L', '101': 'C', '102': 'C', '103': 'R' },
}));

import { assignPlayersToSlots, getSlotLanes } from './player-lane-registry';

describe('player-lane-registry', () => {
  it('returns 4-def slot template L-C-C-R', () => {
    expect(getSlotLanes('DEF', 4)).toEqual(['L', 'C', 'C', 'R']);
  });

  it('places R-lane player on the right in a 4-def line', () => {
    const assigned = assignPlayersToSlots(
      [
        { id: 1, code: 100, startScore: 0.9 },
        { id: 2, code: 101, startScore: 0.85 },
        { id: 3, code: 102, startScore: 0.8 },
        { id: 4, code: 103, startScore: 0.75 },
      ],
      getSlotLanes('DEF', 4)
    );

    expect(assigned[0].lane).toBe('L');
    expect(assigned[assigned.length - 1].lane).toBe('R');
    expect(assigned[assigned.length - 1].id).toBe(4);
  });
});
