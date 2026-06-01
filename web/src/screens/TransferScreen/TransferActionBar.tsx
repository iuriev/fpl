import React from 'react';

import { Button } from '@/components/ui/Button/Button';
import { copy } from '@/lib/copy';

import styles from './TransferActionBar.module.css';

export interface TransferActionBarProps {
  onOpenTransfers: () => void;
  onReset: () => void;
  onSave: () => void;
  hasSwaps: boolean;
  hasChanges: boolean;
  isDirty: boolean;
}

export const TransferActionBar: React.FC<TransferActionBarProps> = ({
  onOpenTransfers,
  onReset,
  onSave,
  hasSwaps,
  hasChanges,
  isDirty,
}) => (
  <div className={styles.bar} data-tour="step-9">
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
);

TransferActionBar.displayName = 'TransferActionBar';
