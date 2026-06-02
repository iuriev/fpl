import React from 'react';

import { BottomSheet } from '@/components/ui/BottomSheet/BottomSheet';
import { copy } from '@/lib/copy';

import styles from './PremiumSheet.module.css';

export interface PremiumSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  freeLabel: string;
  premiumLabel: string;
}

export const PremiumSheet: React.FC<PremiumSheetProps> = ({
  open,
  onClose,
  title,
  description,
  freeLabel,
  premiumLabel,
}) => (
  <BottomSheet open={open} onClose={onClose} title={title}>
    <div className={styles.body}>
      <div className={styles.icon} aria-hidden="true">⭐</div>

      <p className={styles.description}>{description}</p>

      <div className={styles.tiers}>
        <div className={`${styles.tier} ${styles.tierFree}`}>
          <span className={styles.tierLabel}>{copy.premiumSheetFreeTier}</span>
          <span className={styles.tierValue}>{freeLabel}</span>
        </div>
        <div className={`${styles.tier} ${styles.tierPremium}`}>
          <span className={styles.tierLabel}>{copy.premiumSheetPremiumTier}</span>
          <span className={styles.tierValue}>{premiumLabel}</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.upgradeBtn} onClick={onClose}>
          {copy.premiumSheetUpgrade}
        </button>
        <span className={styles.comingSoon}>{copy.premiumSheetComingSoon}</span>
        <button className={styles.dismissBtn} onClick={onClose}>
          {copy.premiumSheetDismiss}
        </button>
      </div>
    </div>
  </BottomSheet>
);

PremiumSheet.displayName = 'PremiumSheet';
