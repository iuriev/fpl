import { createContext, useContext } from 'react';

type ShowPremium = () => void;

export const PlayerWatchlistPremiumContext = createContext<ShowPremium>(() => {});

export function useShowPlayerWatchlistPremium(): ShowPremium {
  return useContext(PlayerWatchlistPremiumContext);
}
