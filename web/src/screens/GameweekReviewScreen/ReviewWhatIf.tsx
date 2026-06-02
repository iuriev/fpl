import React from 'react';

import { copy, interpolate } from '@/lib/copy';

import styles from './ReviewWhatIf.module.css';

export interface ReviewWhatIfProps {
  actualPoints: number;
  whatIfScore: number;
}

export const ReviewWhatIf: React.FC<ReviewWhatIfProps> = ({ actualPoints, whatIfScore }) => {
  const delta = actualPoints - whatIfScore;
  const gained = delta > 0;
  const breakEven = delta === 0;

  const verdict = breakEven
    ? copy.reviewWhatIfBreakEven
    : gained
      ? interpolate(copy.reviewWhatIfGain, { n: delta })
      : interpolate(copy.reviewWhatIfLoss, { n: Math.abs(delta) });

  return (
    <div className={styles.section}>
      <span className={styles.sectionLabel}>{copy.reviewWhatIfSection}</span>
      <div className={styles.card}>
        <div className={`${styles.row} ${styles.rowActual}`}>
          <div className={styles.rowLabel}>
            <strong>{copy.reviewWhatIfActual}</strong>
            <span>{copy.reviewWhatIfWithTransfers}</span>
          </div>
          <span className={styles.rowPts}>{actualPoints}</span>
        </div>
        <div className={`${styles.row} ${styles.rowHypothetical}`}>
          <div className={styles.rowLabel}>
            <strong>{copy.reviewWhatIfHypothetical}</strong>
          </div>
          <span className={`${styles.rowPts} ${styles.rowPtsMuted}`}>{whatIfScore}</span>
        </div>
        <div
          className={`${styles.verdict} ${gained ? styles.verdictGood : breakEven ? styles.verdictNeutral : styles.verdictBad}`}
        >
          <span className={styles.verdictIcon} aria-hidden="true">
            {gained ? '✅' : breakEven ? '🤝' : '😬'}
          </span>
          <span>{verdict}</span>
        </div>
      </div>
    </div>
  );
};

ReviewWhatIf.displayName = 'ReviewWhatIf';
