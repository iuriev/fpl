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
  onBack: () => void;
  onChipToggle: (chip: 'wildcard' | 'freehit') => void;
  onFreeTransfersChange: (n: number) => void;
}

export const TransferHeader: React.FC<TransferHeaderProps> = ({
  bank,
  freeTransfers,
  cost,
  chip,
  nextGw,
  onBack,
  onChipToggle,
  onFreeTransfersChange,
}) => {
  const chipActive = chip !== 'none';

  return (
    <div className={styles.header}>
      <button className={styles.backBtn} onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {copy.transfersBack}
      </button>

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
        {!chipActive && (
          <>
            <div className={styles.divider} aria-hidden="true" />
            <div className={styles.stat}>
              <div className={styles.stepper}>
                <button
                  className={styles.stepperBtn}
                  onClick={() => onFreeTransfersChange(Math.max(1, freeTransfers - 1))}
                  aria-label="Decrease free transfers"
                  disabled={freeTransfers <= 1}
                >
                  −
                </button>
                <span className={styles.stepperValue}>{freeTransfers}</span>
                <button
                  className={styles.stepperBtn}
                  onClick={() => onFreeTransfersChange(Math.min(5, freeTransfers + 1))}
                  aria-label="Increase free transfers"
                  disabled={freeTransfers >= 5}
                >
                  +
                </button>
              </div>
              <span className={styles.statLabel}>{copy.transfersFree}</span>
            </div>
          </>
        )}
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
