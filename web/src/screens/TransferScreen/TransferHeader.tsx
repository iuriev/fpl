import React, { useEffect, useState } from 'react';

import { CHIP_LABELS } from '@/components/ui/ChipBadge/ChipBadge';
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
  onHelp: () => void;
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
  onHelp,
}) => {
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!blockedMsg) return;
    const t = setTimeout(() => setBlockedMsg(null), 3000);
    return () => clearTimeout(t);
  }, [blockedMsg]);
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
      const name = chip !== 'none' ? CHIP_LABELS[chip as keyof typeof CHIP_LABELS] : chip;
      const usedInGw = chipStatuses[key].usedInGw;
      const msg = usedInGw !== undefined
        ? interpolate(copy.chipBlockedUsed, { name, gw: usedInGw })
        : interpolate(copy.chipBlockedNoGw, { name });
      setBlockedMsg(msg);
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
    <div className={styles.header} data-tour="header">
      <div className={styles.topRow}>
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

        <span className={styles.title}>{copy.transfersTitle}</span>

        <button
          className={styles.helpBtn}
          onClick={onHelp}
          aria-label={copy.tourHelpButton}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
      </div>

      <div className={styles.chipsRow} data-tour="step-1">
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

        {blockedMsg && (
          <div className={styles.hint} role="status">
            {blockedMsg}
          </div>
        )}
      </div>

      <div className={styles.statsBar} data-tour="step-2">
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
