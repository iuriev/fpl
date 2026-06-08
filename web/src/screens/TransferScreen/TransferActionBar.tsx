import React from 'react';

import { Button } from '@/components/ui/Button/Button';
import { copy } from '@/lib/copy';
import { useRequestPremiumUpsell } from '@/lib/premium-upsell/PremiumUpsellContext';
import { usePremiumStatus } from '@/lib/use-premium-status';

import styles from './TransferActionBar.module.css';

export interface TransferActionBarProps {
  onOpenTransfers: () => void;
  onReset: () => void;
  onSave: () => void;
  onAiFreeHit: () => void;
  hasSwaps: boolean;
  hasChanges: boolean;
  isDirty: boolean;
  isAiLoading: boolean;
  freehitAvailable: boolean;
}

export const TransferActionBar: React.FC<TransferActionBarProps> = ({
  onOpenTransfers,
  onReset,
  onSave,
  onAiFreeHit,
  hasSwaps,
  hasChanges,
  isDirty,
  isAiLoading,
  freehitAvailable,
}) => {
  const isPremium = usePremiumStatus();
  const requestPremiumUpsell = useRequestPremiumUpsell();

  const handleAiFreeHit = () => {
    if (!isPremium) {
      requestPremiumUpsell('transfer');
      return;
    }
    onAiFreeHit();
  };

  return (
    <div className={styles.bar} data-tour="step-9">
      <div className={styles.row}>
        <Button variant="secondary" onClick={onOpenTransfers} disabled={!hasSwaps}>
          {copy.transfersTitle}
        </Button>
        <Button variant="secondary" onClick={onReset} disabled={!hasChanges}>
          {copy.transfersReset}
        </Button>
        <Button variant="primary" onClick={onSave} disabled={!isDirty || !hasChanges}>
          {copy.transfersSavePlan}
        </Button>
      </div>
      <div className={styles.row}>
        <Button
          variant="secondary"
          onClick={handleAiFreeHit}
          disabled={isAiLoading || (isPremium && !freehitAvailable)}
          title={isPremium && !freehitAvailable ? copy.aiFreehitPlayed : undefined}
        >
          {isAiLoading ? '…' : copy.aiFreehitButton}
        </Button>
        <Button
          variant="secondary"
          disabled
          title="Coming soon"
        >
          {copy.aiWildcardButton}
        </Button>
      </div>
    </div>
  );
};

TransferActionBar.displayName = 'TransferActionBar';
