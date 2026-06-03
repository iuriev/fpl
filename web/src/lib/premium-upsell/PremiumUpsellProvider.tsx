import React, { useCallback, useMemo, useState } from 'react';

import { PremiumUpsellDialog } from '@/components/ui/PremiumUpsellDialog/PremiumUpsellDialog';
import { usePremiumStatus } from '@/lib/use-premium-status';

import {
  PremiumUpsellContext,
  type PremiumUpsellScreen,
} from './PremiumUpsellContext';
import { isCooldownElapsed, setLastShown } from './premiumUpsellStorage';
import { readPremiumUpsellConfig } from './readPremiumUpsellConfig';

export function PremiumUpsellProvider({ children }: { children: React.ReactNode }) {
  const config = useMemo(() => readPremiumUpsellConfig(), []);
  const isPremium = usePremiumStatus();
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState<PremiumUpsellScreen>('transfer');

  const dismiss = useCallback((screen: PremiumUpsellScreen) => {
    setLastShown(screen, Date.now());
    setOpen(false);
  }, []);

  const requestUpsell = useCallback(
    (screen: PremiumUpsellScreen) => {
      if (isPremium || !config.enabled) return;
      if (!isCooldownElapsed(screen, config.cooldownMs)) return;
      setVariant(screen);
      setOpen(true);
    },
    [isPremium, config.enabled, config.cooldownMs]
  );

  const handleClose = useCallback(() => {
    dismiss(variant);
  }, [dismiss, variant]);

  return (
    <PremiumUpsellContext.Provider value={requestUpsell}>
      {children}
      <PremiumUpsellDialog open={open} variant={variant} onClose={handleClose} />
    </PremiumUpsellContext.Provider>
  );
}
