import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getLastShown, isCooldownElapsed, setLastShown } from './premiumUpsellStorage';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-03T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('premiumUpsellStorage', () => {
  it('returns null when never shown', () => {
    expect(getLastShown('transfer')).toBeNull();
    expect(isCooldownElapsed('transfer', 86_400_000)).toBe(true);
  });

  it('records last shown per screen', () => {
    setLastShown('transfer', Date.now());
    expect(getLastShown('transfer')).toBe(Date.now());
    expect(getLastShown('predictions')).toBeNull();
  });

  it('respects cooldown', () => {
    setLastShown('transfer', Date.now());
    expect(isCooldownElapsed('transfer', 86_400_000)).toBe(false);
    vi.advanceTimersByTime(86_400_000);
    expect(isCooldownElapsed('transfer', 86_400_000)).toBe(true);
  });
});
