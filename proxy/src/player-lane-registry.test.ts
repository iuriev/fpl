import { describe, expect, it, vi } from 'vitest';

vi.mock('./data/player-lanes.json', () => ({
  default: { '100': 'L', '101': 'C', '102': 'C', '103': 'R' },
}));

vi.mock('./data/player-tactical-roles.json', () => ({
  default: {
    '100': { role: 'lb', lane: 'L', secondary: [] },
    '101': { role: 'cb', lane: 'C', secondary: [] },
    '102': { role: 'cb', lane: 'C', secondary: [] },
    '103': { role: 'rb', lane: 'R', secondary: ['cb'] },
  },
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
      'DEF',
      4
    );

    expect(assigned[0].lane).toBe('L');
    expect(assigned[assigned.length - 1].lane).toBe('R');
    expect(assigned.find((a) => a.lane === 'R')?.id).toBe(4);
  });

  it('keeps wide defenders out of central slots when centres are available', () => {
    const assigned = assignPlayersToSlots(
      [
        { id: 1, code: 100, startScore: 0.95 },
        { id: 2, code: 101, startScore: 0.9 },
        { id: 3, code: 102, startScore: 0.85 },
        { id: 4, code: 103, startScore: 0.5 },
      ],
      'DEF',
      4
    );

    const byId = new Map(assigned.map((a) => [a.id, a.lane]));
    expect(byId.get(1)).toBe('L');
    expect(byId.get(2)).toBe('C');
    expect(byId.get(3)).toBe('C');
    expect(byId.get(4)).toBe('R');
  });
});
