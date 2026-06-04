import { describe, expect, it, vi } from 'vitest';

vi.mock('./data/player-tactical-roles.json', () => ({
  default: {
    '100': { role: 'cb', lane: 'C', secondary: ['lb'] },
    '101': { role: 'lb', lane: 'L', secondary: [] },
    '102': { role: 'rb', lane: 'R', secondary: ['cb'] },
    '103': { role: 'dm', lane: 'C', secondary: ['cm'] },
    '104': { role: 'lm', lane: 'L', secondary: [] },
    '105': { role: 'lw', lane: 'L', secondary: [] },
    '106': { role: 'am', lane: 'C', secondary: [] },
    '107': { role: 'st', lane: 'C', secondary: [] },
    '108': { role: 'rw', lane: 'R', secondary: [] },
    '109': { role: 'rm', lane: 'R', secondary: [] },
  },
}));

import {
  fillTierForRole,
  getPlayerTacticalRole,
  playerFillsRole,
} from './player-tactical-role';

describe('player-tactical-role', () => {
  it('uses primary role first', () => {
    expect(getPlayerTacticalRole(101)).toBe('lb');
    expect(playerFillsRole(101, 'lb', 'DEF')).toBe(true);
    expect(fillTierForRole(101, 'lb', 'DEF')).toBe(0);
  });

  it('uses secondary before group fallback', () => {
    expect(fillTierForRole(100, 'lb', 'DEF')).toBe(1);
    expect(playerFillsRole(100, 'lb', 'DEF')).toBe(true);
    expect(fillTierForRole(102, 'cb', 'DEF')).toBe(1);
  });

  it('allows any defender as last-resort lb', () => {
    expect(fillTierForRole(102, 'lb', 'DEF')).toBe(2);
    expect(playerFillsRole(102, 'lb', 'DEF')).toBe(true);
  });

  it('keeps lm/rm in MID group and lw/rw in FWD group', () => {
    expect(playerFillsRole(104, 'lm', 'MID')).toBe(true);
    expect(playerFillsRole(104, 'lw', 'FWD')).toBe(false);
    expect(playerFillsRole(105, 'lw', 'FWD')).toBe(true);
    expect(playerFillsRole(105, 'lm', 'MID')).toBe(false);
  });

  it('blocks central mids and strikers from wide slots', () => {
    expect(fillTierForRole(106, 'lm', 'MID')).toBe(3);
    expect(fillTierForRole(106, 'rm', 'MID')).toBe(3);
    expect(fillTierForRole(106, 'cm', 'MID')).toBe(2);
    expect(fillTierForRole(107, 'lw', 'FWD')).toBe(3);
    expect(fillTierForRole(107, 'rw', 'FWD')).toBe(3);
    expect(fillTierForRole(107, 'st', 'FWD')).toBe(0);
  });
});
