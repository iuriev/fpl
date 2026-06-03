import { useSubscriptionTier } from '@/lib/use-subscription-tier';

export function usePremiumStatus(): boolean {
  if (import.meta.env.VITE_PREMIUM_DEV_IS_PREMIUM === 'true') return true;
  return useSubscriptionTier() === 'premium';
}
