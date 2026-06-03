import { useCurrentUser } from '@/auth/AuthContext';
import type { SubscriptionTier } from '@/types';

export function useSubscriptionTier(): SubscriptionTier {
  const { user } = useCurrentUser();
  return user?.subscriptionTier ?? 'free';
}
