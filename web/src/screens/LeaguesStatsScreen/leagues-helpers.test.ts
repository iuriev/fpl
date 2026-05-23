import { describe, expect,it } from 'vitest';

import { formatRank,getLeagueRankDirection } from './leagues-helpers';

describe('getLeagueRankDirection', () => {
  it('returns neutral when lastRank is null (newly joined)', () => {
    expect(getLeagueRankDirection(5, null)).toBe('neutral');
  });

  it('returns up when rank improved (lower number = better)', () => {
    expect(getLeagueRankDirection(3, 5)).toBe('up');
  });

  it('returns down when rank worsened (higher number = worse)', () => {
    expect(getLeagueRankDirection(5, 3)).toBe('down');
  });

  it('returns neutral when rank is unchanged', () => {
    expect(getLeagueRankDirection(4, 4)).toBe('neutral');
  });

  it('handles large rank numbers', () => {
    expect(getLeagueRankDirection(1000000, 1100000)).toBe('up');
    expect(getLeagueRankDirection(1100000, 1000000)).toBe('down');
  });

  it('returns up when rank is 1 and improved from 2', () => {
    expect(getLeagueRankDirection(1, 2)).toBe('up');
  });
});

describe('formatRank', () => {
  it('formats large numbers with thousand separators', () => {
    expect(formatRank(1234567)).toBe('1,234,567');
  });

  it('formats small numbers without separators', () => {
    expect(formatRank(5)).toBe('5');
  });

  it('formats exactly 1000', () => {
    expect(formatRank(1000)).toBe('1,000');
  });
});
