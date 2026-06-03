export type SubscriptionTier = 'free' | 'premium';

export function resolveSubscriptionTier(
  dbTier: string | null | undefined,
  email: string
): SubscriptionTier {
  const override = process.env.PREMIUM_OVERRIDE_EMAIL?.trim();
  if (override && email === override) return 'premium';
  return dbTier === 'premium' ? 'premium' : 'free';
}

export function isPremiumTier(tier: SubscriptionTier): boolean {
  return tier === 'premium';
}
