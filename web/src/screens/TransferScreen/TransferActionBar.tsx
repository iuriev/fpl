import React from 'react';

import { Button } from '@/components/ui/Button/Button';
import { copy } from '@/lib/copy';

import styles from './TransferActionBar.module.css';

export interface TransferActionBarProps {
  onReset: () => void;
  onSave: () => void;
  hasSwaps: boolean;
}

export const TransferActionBar: React.FC<TransferActionBarProps> = ({
  onReset,
  onSave,
  hasSwaps,
}) => (
  <div className={styles.bar}>
    <Button variant="secondary" onClick={onReset} disabled={!hasSwaps}>
      {copy.transfersReset}
    </Button>
    <Button variant="primary" onClick={onSave} disabled={!hasSwaps}>
      {copy.transfersSavePlan}
    </Button>
  </div>
);

TransferActionBar.displayName = 'TransferActionBar';
