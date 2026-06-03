import { afterEach, describe, expect, it } from 'vitest';

import { isPremiumTier, resolveSubscriptionTier } from './subscription';

describe('resolveSubscriptionTier', () => {
  const prev = process.env.PREMIUM_OVERRIDE_EMAIL;

  afterEach(() => {
    if (prev === undefined) delete process.env.PREMIUM_OVERRIDE_EMAIL;
    else process.env.PREMIUM_OVERRIDE_EMAIL = prev;
  });

  it('returns free by default', () => {
    delete process.env.PREMIUM_OVERRIDE_EMAIL;
    expect(resolveSubscriptionTier('free', 'a@test.com')).toBe('free');
    expect(resolveSubscriptionTier(null, 'a@test.com')).toBe('free');
  });

  it('returns premium from database tier', () => {
    expect(resolveSubscriptionTier('premium', 'a@test.com')).toBe('premium');
  });

  it('overrides email when env is set', () => {
    process.env.PREMIUM_OVERRIDE_EMAIL = 'dev@test.com';
    expect(resolveSubscriptionTier('free', 'dev@test.com')).toBe('premium');
    expect(resolveSubscriptionTier('free', 'other@test.com')).toBe('free');
  });
});

describe('isPremiumTier', () => {
  it('is true only for premium', () => {
    expect(isPremiumTier('premium')).toBe(true);
    expect(isPremiumTier('free')).toBe(false);
  });
});
