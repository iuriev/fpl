import React from 'react';

import { ChipIconSvg } from '@/components/ui/ChipBadge/ChipBadge';
import { CHIP_LABELS } from '@/components/ui/ChipBadge/ChipBadge.constants';
import { copy } from '@/lib/copy';
import type { ActiveChip, SquadSummary } from '@/types';

import styles from './SummaryStrip.module.css';

export interface SummaryStripProps {
  summary: SquadSummary;
  activeChip?: ActiveChip;
}

function fmt(value: number | undefined | null): string {
  if (value == null) return copy.summaryPlaceholder;
  return value.toLocaleString('en-GB');
}

export const SummaryStrip: React.FC<SummaryStripProps> = ({ summary, activeChip }) => {
  return (
    <div className={styles.strip}>
      <div className={`${styles.stat} ${styles.statTotal}`}>
        <span className={styles.value}>{fmt(summary.totalPoints)}</span>
        <span className={styles.label}>{copy.summaryTotal}</span>
      </div>

      {activeChip ? (
        <div className={`${styles.stat} ${styles.statChip} ${styles[`chip_${activeChip}`]}`}>
          <span className={styles.chipIcon}>
            <ChipIconSvg chip={activeChip} />
          </span>
          <span className={styles.chipText}>
            <span className={styles.value}>{CHIP_LABELS[activeChip]}</span>
            <span className={styles.label}>{copy.chipActiveSuffix}</span>
          </span>
        </div>
      ) : (
        <>
          <div className={styles.stat}>
            <span className={styles.value}>{fmt(summary.averagePoints)}</span>
            <span className={styles.label}>{copy.summaryAverage}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.value}>{fmt(summary.highestPoints)}</span>
            <span className={styles.label}>{copy.summaryHighest}</span>
          </div>
        </>
      )}

      <div className={styles.stat}>
        <span className={styles.value}>{fmt(summary.rank)}</span>
        <span className={styles.label}>{copy.summaryRank}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.value}>{fmt(summary.transfers)}</span>
        <span className={styles.label}>{copy.summaryTransfers}</span>
      </div>
    </div>
  );
};

SummaryStrip.displayName = 'SummaryStrip';
