import React, { createContext, useCallback, useContext, useState } from 'react';

import { PremiumSheet } from '@/components/ui/PremiumSheet/PremiumSheet';

import { copy } from './copy';

type ShowPremium = () => void;

const PlayerWatchlistPremiumContext = createContext<ShowPremium>(() => {});

export function useShowPlayerWatchlistPremium(): ShowPremium {
  return useContext(PlayerWatchlistPremiumContext);
}

export function PlayerWatchlistPremiumProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);

  return (
    <PlayerWatchlistPremiumContext.Provider value={show}>
      {children}
      <PremiumSheet
        open={open}
        onClose={() => setOpen(false)}
        title={copy.premiumPlayerWatchlistTitle}
        description={copy.premiumPlayerWatchlistDescription}
        freeLabel={copy.premiumPlayerWatchlistFreeLabel}
        premiumLabel={copy.premiumPlayerWatchlistPremiumLabel}
      />
    </PlayerWatchlistPremiumContext.Provider>
  );
}
