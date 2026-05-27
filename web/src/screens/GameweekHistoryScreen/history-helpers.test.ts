import { describe, expect, it } from 'vitest';

import { formatNumber, formatValue, getRankDirection } from './history-helpers';

describe('getRankDirection', () => {
  it('returns neutral when no previous rank', () => {
    expect(getRankDirection(1000000, undefined)).toBe('neutral');
  });

  it('returns up when rank improved (lower number)', () => {
    expect(getRankDirection(800000, 1000000)).toBe('up');
  });

  it('returns down when rank worsened (higher number)', () => {
    expect(getRankDirection(1200000, 1000000)).toBe('down');
  });

  it('returns neutral when rank unchanged', () => {
    expect(getRankDirection(1000000, 1000000)).toBe('neutral');
  });

  it('handles rank 1 (top)', () => {
    expect(getRankDirection(1, 5000)).toBe('up');
  });
});

describe('formatNumber', () => {
  it('formats with thousand separators', () => {
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('formats numbers under 1000 without separator', () => {
    expect(formatNumber(500)).toBe('500');
  });

  it('formats numbers in the tens of thousands', () => {
    expect(formatNumber(50000)).toBe('50,000');
  });
});

describe('formatValue', () => {
  it('formats to one decimal place', () => {
    expect(formatValue(103.9)).toBe('103.9');
  });

  it('pads with zero when whole number', () => {
    expect(formatValue(100)).toBe('100.0');
  });

  it('rounds to one decimal', () => {
    expect(formatValue(102.15)).toBe('102.2');
  });
});
