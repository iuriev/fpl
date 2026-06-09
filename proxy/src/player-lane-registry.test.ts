import { describe, expect, it, vi } from 'vitest';

import { assignPlayersToSlots, getSlotLanes } from './player-lane-registry';

vi.mock('./data/player-lanes.json', () => ({
  default: { '100': 'L', '101': 'C', '102': 'C', '103': 'R' },
}));

vi.mock('./data/player-tactical-roles.json', () => ({
  default: {
    '100': { role: 'lb', lane: 'L', secondary: [] },
    '101': { role: 'cb', lane: 'C', secondary: [] },
    '102': { role: 'cb', lane: 'C', secondary: [] },
    '103': { role: 'rb', lane: 'R', secondary: ['cb'] },
    '200': { role: 'lb', lane: 'L', secondary: ['cb'] },
    '201': { role: 'cb', lane: 'C', secondary: [] },
    '202': { role: 'cb', lane: 'C', secondary: [] },
    '203': { role: 'cb', lane: 'C', secondary: [] },
    '300': { role: 'st', lane: 'C', secondary: [] },
    '301': { role: 'lw', lane: 'L', secondary: [] },
    '302': { role: 'rw', lane: 'R', secondary: [] },
    '310': { role: 'am', lane: 'C', secondary: [] },
    '311': { role: 'lm', lane: 'L', secondary: [] },
    '312': { role: 'rm', lane: 'R', secondary: [] },
    '313': { role: 'dm', lane: 'C', secondary: [] },
    '320': { role: 'cb', lane: 'C', secondary: [] },
    '210': { role: 'lb', lane: 'L', secondary: ['cb'] },
    '211': { role: 'cb', lane: 'C', secondary: [] },
    '212': { role: 'rb', lane: 'R', secondary: ['cb'] },
    '213': { role: 'rb', lane: 'R', secondary: ['cb', 'lb'] },
    '214': { role: 'cb', lane: 'C', secondary: [] },
  },
}));

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

  it('puts best centre-backs in the middle and lower-rated cb on the flank', () => {
    const assigned = assignPlayersToSlots(
      [
        { id: 1, code: 200, startScore: 0.75 },
        { id: 2, code: 201, startScore: 0.95 },
        { id: 3, code: 202, startScore: 0.92 },
        { id: 4, code: 203, startScore: 0.55 },
      ],
      'DEF',
      4
    );

    const byId = new Map(assigned.map((a) => [a.id, a.lane]));
    expect(byId.get(2)).toBe('C');
    expect(byId.get(3)).toBe('C');
    expect(byId.get(1)).toBe('L');
    expect(byId.get(4)).toBe('R');
  });

  it('keeps the best striker in the centre in a 3-forward line', () => {
    const assigned = assignPlayersToSlots(
      [
        { id: 1, code: 300, startScore: 0.98 },
        { id: 2, code: 301, startScore: 0.7 },
        { id: 3, code: 302, startScore: 0.65 },
      ],
      'FWD',
      3
    );
    expect(assigned.find((a) => a.id === 1)?.lane).toBe('C');
    expect(assigned.find((a) => a.id === 2)?.lane).toBe('L');
    expect(assigned.find((a) => a.id === 3)?.lane).toBe('R');
  });

  it('keeps a central attacking mid off lm and rm in a 4-mid line', () => {
    const assigned = assignPlayersToSlots(
      [
        { id: 1, code: 310, startScore: 0.95 },
        { id: 2, code: 311, startScore: 0.8 },
        { id: 3, code: 313, startScore: 0.75 },
        { id: 4, code: 312, startScore: 0.7 },
      ],
      'MID',
      4
    );
    expect(assigned.find((a) => a.id === 1)?.lane).toBe('C');
    expect(assigned.find((a) => a.id === 2)?.lane).toBe('L');
    expect(assigned.find((a) => a.id === 4)?.lane).toBe('R');
  });

  it('fills wings before centre and keeps the spare full-back off centre', () => {
    const assigned = assignPlayersToSlots(
      [
        { id: 1, code: 210, startScore: 1.22 },
        { id: 2, code: 211, startScore: 0.99 },
        { id: 3, code: 212, startScore: 0.89 },
        { id: 4, code: 214, startScore: 0.75 },
      ],
      'DEF',
      4
    );

    const byId = new Map(assigned.map((a) => [a.id, a.lane]));
    expect(byId.get(1)).toBe('L');
    expect(byId.get(2)).toBe('C');
    expect(byId.get(3)).toBe('R');
    expect(byId.get(4)).toBe('C');
  });

  it('assigns every picked player even when tactical profile is for another line', () => {
    const assigned = assignPlayersToSlots(
      [
        { id: 1, code: 201, startScore: 0.95 },
        { id: 2, code: 202, startScore: 0.9 },
        { id: 3, code: 320, startScore: 0.85 },
        { id: 4, code: 310, startScore: 0.8 },
        { id: 5, code: 311, startScore: 0.75 },
      ],
      'MID',
      5
    );
    expect(assigned).toHaveLength(5);
  });
});
