import React from 'react';

import { copy } from '@/lib/copy';
import type { SquadSummary } from '@/types';

import styles from './SummaryStrip.module.css';

export interface SummaryStripProps {
  summary: SquadSummary;
}

function fmt(value: number | undefined | null): string {
  if (value == null) return copy.summaryPlaceholder;
  return value.toLocaleString('en-GB');
}

export const SummaryStrip: React.FC<SummaryStripProps> = ({ summary }) => {
  return (
    <div className={styles.strip}>
      <div className={`${styles.stat} ${styles.statTotal}`}>
        <span className={styles.value}>{fmt(summary.totalPoints)}</span>
        <span className={styles.label}>{copy.summaryTotal}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.value}>{fmt(summary.averagePoints)}</span>
        <span className={styles.label}>{copy.summaryAverage}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.value}>{fmt(summary.highestPoints)}</span>
        <span className={styles.label}>{copy.summaryHighest}</span>
      </div>
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
