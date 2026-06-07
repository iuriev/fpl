import { createContext, useContext } from 'react';

export type PremiumUpsellScreen = 'transfer' | 'predictions' | 'market';

type RequestPremiumUpsell = (screen: PremiumUpsellScreen) => void;

export const PremiumUpsellContext = createContext<RequestPremiumUpsell>(() => {});

export function useRequestPremiumUpsell(): RequestPremiumUpsell {
  return useContext(PremiumUpsellContext);
}
