import React from 'react';

import { copy } from '@/lib/copy';

import styles from './PremiumLockedOverlay.module.css';

export interface PremiumLockedOverlayProps {
  onUnlock: () => void;
}

export const PremiumLockedOverlay: React.FC<PremiumLockedOverlayProps> = ({ onUnlock }) => {
  return (
    <div className={styles.overlay}>
      <button type="button" className={styles.cta} onClick={onUnlock}>
        <span className={styles.lock} aria-hidden="true">
          🔒
        </span>
        <span className={styles.label}>{copy.priceChangesUnlockSquad}</span>
      </button>
    </div>
  );
};

PremiumLockedOverlay.displayName = 'PremiumLockedOverlay';
