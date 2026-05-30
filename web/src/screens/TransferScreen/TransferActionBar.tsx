import React from 'react';

import { Button } from '@/components/ui/Button/Button';
import { copy } from '@/lib/copy';

import styles from './TransferActionBar.module.css';

export interface TransferActionBarProps {
  onReset: () => void;
  onSave: () => void;
  hasChanges: boolean;
}

export const TransferActionBar: React.FC<TransferActionBarProps> = ({
  onReset,
  onSave,
  hasChanges,
}) => (
  <div className={styles.bar} data-tour="step-9">
    <Button variant="secondary" onClick={onReset} disabled={!hasChanges}>
      {copy.transfersReset}
    </Button>
    <Button variant="primary" onClick={onSave} disabled={!hasChanges}>
      {copy.transfersSavePlan}
    </Button>
  </div>
);

TransferActionBar.displayName = 'TransferActionBar';
