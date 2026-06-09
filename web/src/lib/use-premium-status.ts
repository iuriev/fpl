import { useSubscriptionTier } from '@/lib/use-subscription-tier';

export function usePremiumStatus(): boolean {
  return useSubscriptionTier() === 'premium';
}
