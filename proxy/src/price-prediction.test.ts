import { describe, expect, it } from 'vitest';

import {
  netTransfersEvent,
  predictLikelihood,
  thresholdForOwnership,
  transferInPercent,
} from './price-prediction';

describe('thresholdForOwnership', () => {
  it('increases threshold with ownership', () => {
    expect(thresholdForOwnership('0')).toBe(40_000);
    expect(thresholdForOwnership('50')).toBe(70_000);
  });
});

describe('predictLikelihood', () => {
  const threshold = 50_000;

  it('classifies rise tiers', () => {
    expect(predictLikelihood(40_000, 'rise', threshold)).toBe('unlikely');
    expect(predictLikelihood(50_000, 'rise', threshold)).toBe('likely');
    expect(predictLikelihood(75_000, 'rise', threshold)).toBe('very_likely');
  });

  it('classifies fall tiers', () => {
    expect(predictLikelihood(-40_000, 'fall', threshold)).toBe('unlikely');
    expect(predictLikelihood(-50_000, 'fall', threshold)).toBe('likely');
    expect(predictLikelihood(-75_000, 'fall', threshold)).toBe('very_likely');
  });
});

describe('transferInPercent', () => {
  it('returns null when no activity', () => {
    expect(transferInPercent(0, 0)).toBeNull();
  });

  it('computes share of ins', () => {
    expect(transferInPercent(75_000, 25_000)).toBe(75);
  });
});

describe('netTransfersEvent', () => {
  it('subtracts outs from ins', () => {
    expect(netTransfersEvent(100, 30)).toBe(70);
  });
});
