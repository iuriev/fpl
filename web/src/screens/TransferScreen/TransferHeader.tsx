import React from 'react';
import { copy, interpolate } from '@/lib/copy';
import type { TransferChip } from '@/types';
import styles from './TransferHeader.module.css';

export interface TransferHeaderProps {
  bank: number;
  freeTransfers: number;
  cost: number;
  chip: TransferChip;
  nextGw: number | null;
  onChipToggle: (chip: 'wildcard' | 'freehit') => void;
  onFreeTransfersChange: (n: number) => void;
}

export const TransferHeader: React.FC<TransferHeaderProps> = ({
  bank,
  freeTransfers,
  cost,
  chip,
  nextGw,
  onChipToggle,
  onFreeTransfersChange,
}) => {
  const chipActive = chip !== 'none';

  return (
    <div className={styles.header}>
      <div className={styles.topRow}>
        <span className={styles.title}>{copy.transfersTitle}</span>
        <div className={styles.chips}>
          <button
            className={`${styles.chipBtn} ${chip === 'wildcard' ? styles.chipBtn_active : ''}`}
            onClick={() => onChipToggle('wildcard')}
            aria-pressed={chip === 'wildcard'}
          >
            {copy.transfersWildcard}
          </button>
          <button
            className={`${styles.chipBtn} ${chip === 'freehit' ? styles.chipBtn_active : ''}`}
            onClick={() => onChipToggle('freehit')}
            aria-pressed={chip === 'freehit'}
          >
            {copy.transfersFreeHit}
          </button>
        </div>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statValue}>£{(bank / 10).toFixed(1)}m</span>
          <span className={styles.statLabel}>{copy.transfersBank}</span>
        </div>
        <div className={styles.divider} aria-hidden="true" />
        <div className={styles.stat}>
          <button
            className={styles.freeBtn}
            onClick={() => {
              const next = freeTransfers >= 5 ? 1 : freeTransfers + 1;
              onFreeTransfersChange(next);
            }}
            title={copy.transfersFreeEditable}
            aria-label={copy.transfersFreeEditable}
          >
            {freeTransfers}
          </button>
          <span className={styles.statLabel}>{copy.transfersFree}</span>
        </div>
        <div className={styles.divider} aria-hidden="true" />
        <div className={styles.stat}>
          {chipActive ? (
            <span className={styles.chipActiveLabel}>
              {chip === 'wildcard'
                ? copy.transfersWildcardActive
                : interpolate(copy.transfersFreeHitActive, { n: nextGw ?? '?' })}
            </span>
          ) : (
            <>
              <span
                className={`${styles.statValue} ${cost > 0 ? (cost >= 8 ? styles.statValue_red : styles.statValue_amber) : ''}`}
              >
                -{cost} pts
              </span>
              <span className={styles.statLabel}>{copy.transfersCost}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

TransferHeader.displayName = 'TransferHeader';
