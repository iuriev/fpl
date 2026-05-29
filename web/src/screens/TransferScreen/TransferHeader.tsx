import React from 'react';

import { copy, interpolate } from '@/lib/copy';
import type { ChipStatuses } from '@/types';

import styles from './TransferHeader.module.css';

type PlanChip = 'none' | 'wildcard' | 'freehit' | 'bboost' | '3xc';

export interface TransferHeaderProps {
  bank: number;
  freeTransfers: number;
  cost: number;
  planChip: PlanChip;
  chipStatuses: ChipStatuses;
  nextGw: number | null;
  onBack: () => void;
  onChipToggle: (chip: PlanChip) => void;
  onChipBlocked: (chip: PlanChip, usedInGw?: number) => void;
}

export const TransferHeader: React.FC<TransferHeaderProps> = ({
  bank,
  freeTransfers,
  cost,
  planChip,
  chipStatuses,
  nextGw,
  onBack,
  onChipToggle,
  onChipBlocked,
}) => {
  const transferChipActive = planChip === 'wildcard' || planChip === 'freehit';
  const anyChipActive = planChip !== 'none';

  function chipBtnClass(name: PlanChip): string {
    const classes = [styles.chipBtn];
    if (planChip === name) classes.push(styles.chipBtn_active);
    const key = name as keyof ChipStatuses;
    if (name !== 'none' && chipStatuses[key].status === 'used') classes.push(styles.chipBtn_used);
    return classes.join(' ');
  }

  function handleChipClick(chip: PlanChip) {
    const key = chip as keyof ChipStatuses;
    if (chipStatuses[key].status === 'used') {
      onChipBlocked(chip, chipStatuses[key].usedInGw);
    } else {
      onChipToggle(chip);
    }
  }

  function chipActiveLabel(): React.ReactNode {
    if (planChip === 'wildcard') return copy.transfersWildcardActive;
    if (planChip === 'freehit') {
      return nextGw !== null && nextGw <= 38
        ? interpolate(copy.transfersFreeHitActive, { n: nextGw })
        : copy.transfersFreeHitActiveFinal;
    }
    if (planChip === 'bboost') return copy.transfersBenchBoostActive;
    if (planChip === '3xc') return copy.transfersTripleCaptainActive;
    return null;
  }

  return (
    <div className={styles.header}>
      <button className={styles.backBtn} onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M10 4l-4 4 4 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {copy.transfersBack}
      </button>

      <div className={styles.topRow}>
        <span className={styles.title}>{copy.transfersTitle}</span>
        <div className={styles.chips}>
          <button
            className={chipBtnClass('wildcard')}
            onClick={() => handleChipClick('wildcard')}
            aria-pressed={planChip === 'wildcard'}
          >
            {copy.transfersWildcard}
          </button>
          <button
            className={chipBtnClass('freehit')}
            onClick={() => handleChipClick('freehit')}
            aria-pressed={planChip === 'freehit'}
          >
            {copy.transfersFreeHit}
          </button>
          <button
            className={chipBtnClass('bboost')}
            onClick={() => handleChipClick('bboost')}
            aria-pressed={planChip === 'bboost'}
          >
            {copy.transfersBenchBoost}
          </button>
          <button
            className={chipBtnClass('3xc')}
            onClick={() => handleChipClick('3xc')}
            aria-pressed={planChip === '3xc'}
          >
            {copy.transfersTripleCaptain}
          </button>
        </div>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statValue}>£{(bank / 10).toFixed(1)}m</span>
          <span className={styles.statLabel}>{copy.transfersBank}</span>
        </div>
        {!transferChipActive && (
          <>
            <div className={styles.divider} aria-hidden="true" />
            <div className={styles.stat}>
              <span className={styles.statValue}>{freeTransfers}</span>
              <span className={styles.statLabel}>{copy.transfersFree}</span>
            </div>
          </>
        )}
        <div className={styles.divider} aria-hidden="true" />
        <div className={styles.stat}>
          {anyChipActive ? (
            <span className={styles.chipActiveLabel}>{chipActiveLabel()}</span>
          ) : (
            <>
              <span
                className={`${styles.statValue} ${cost > 0 ? (cost >= 8 ? styles.statValue_red : styles.statValue_amber) : ''}`}
              >
                {cost > 0 ? `-${cost}` : '0'} pts
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
