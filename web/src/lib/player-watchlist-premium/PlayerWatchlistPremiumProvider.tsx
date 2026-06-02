import React, { useCallback, useState } from 'react';

import { PremiumSheet } from '@/components/ui/PremiumSheet/PremiumSheet';

import { copy } from '../copy';
import { PlayerWatchlistPremiumContext } from './PlayerWatchlistPremiumContext';

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
