import { describe, expect, it, vi } from 'vitest';

import {
  bestQuotaRoleMeritScore,
  fillTierForRole,
  getPlayerTacticalRole,
  playerFillsRole,
  playerQualifiesForQuotaRole,
  roleMeritScore,
} from './player-tactical-role';

vi.mock('./data/player-tactical-roles.json', () => ({
  default: {
    '100': { role: 'cb', lane: 'C', secondary: ['lb'] },
    '101': { role: 'lb', lane: 'L', secondary: [] },
    '102': { role: 'rb', lane: 'R', secondary: ['cb'] },
    '103': { role: 'dm', lane: 'C', secondary: ['cm'] },
    '104': { role: 'lm', lane: 'L', secondary: [] },
    '105': { role: 'lw', lane: 'L', secondary: [] },
    '106': { role: 'am', lane: 'C', secondary: [] },
    '107': { role: 'cm', lane: 'C', secondary: [] },
    '108': { role: 'st', lane: 'C', secondary: [] },
    '109': { role: 'rm', lane: 'R', secondary: [] },
  },
}));

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

  it('only primary role qualifies for lineup quotas', () => {
    expect(playerQualifiesForQuotaRole(100, 'lb', 'DEF')).toBe(false);
    expect(playerQualifiesForQuotaRole(100, 'cb', 'DEF')).toBe(true);
    expect(playerQualifiesForQuotaRole(101, 'lb', 'DEF')).toBe(true);
    expect(playerQualifiesForQuotaRole(101, 'cb', 'DEF')).toBe(false);
    expect(playerQualifiesForQuotaRole(102, 'rb', 'DEF')).toBe(true);
    expect(playerQualifiesForQuotaRole(102, 'cb', 'DEF')).toBe(false);
  });

  it('does not group-fallback opposite full-back roles', () => {
    expect(fillTierForRole(102, 'lb', 'DEF')).toBe(3);
    expect(playerFillsRole(102, 'lb', 'DEF')).toBe(false);
    expect(fillTierForRole(100, 'lb', 'DEF')).toBe(1);
    expect(playerFillsRole(100, 'lb', 'DEF')).toBe(true);
  });

  it('keeps lm/rm in MID group and lw/rw in FWD group', () => {
    expect(playerFillsRole(104, 'lm', 'MID')).toBe(true);
    expect(playerFillsRole(104, 'lw', 'FWD')).toBe(false);
    expect(playerFillsRole(105, 'lw', 'FWD')).toBe(true);
    expect(playerFillsRole(105, 'lm', 'MID')).toBe(true);
    expect(fillTierForRole(105, 'lm', 'MID')).toBe(0);
    expect(fillTierForRole(104, 'rm', 'MID')).toBe(3);
  });

  it('prefers quota merit on primary role over group fallback', () => {
    expect(playerQualifiesForQuotaRole(107, 'lm', 'MID')).toBe(false);
    expect(roleMeritScore(107, 'lm', 'MID', 0.9)).toBe(0);
    expect(roleMeritScore(104, 'lm', 'MID', 0.7)).toBe(0.7);
    expect(
      bestQuotaRoleMeritScore(107, ['lm'], 'MID', 0.9) <
        bestQuotaRoleMeritScore(104, ['lm'], 'MID', 0.7)
    ).toBe(true);
  });

  it('blocks central mids and strikers from wide slots', () => {
    expect(fillTierForRole(106, 'lm', 'MID')).toBe(3);
    expect(fillTierForRole(106, 'rm', 'MID')).toBe(3);
    expect(fillTierForRole(106, 'cm', 'MID')).toBe(2);
    expect(fillTierForRole(108, 'lw', 'FWD')).toBe(3);
    expect(fillTierForRole(108, 'rw', 'FWD')).toBe(3);
    expect(fillTierForRole(108, 'st', 'FWD')).toBe(0);
  });
});
