import React from 'react';

import styles from './PredictedPlayerPlaceholderRow.module.css';

export interface PredictedPlayerPlaceholderRowProps {
  rank: number;
}

export const PredictedPlayerPlaceholderRow: React.FC<PredictedPlayerPlaceholderRowProps> = ({
  rank,
}) => (
  <div className={styles.row} aria-hidden="true">
    <span className={styles.rank}>{rank}</span>
    <div className={`${styles.shimmer} ${styles.jersey}`} />
    <div className={styles.info}>
      <div className={`${styles.shimmer} ${styles.name}`} />
      <div className={`${styles.shimmer} ${styles.meta}`} />
    </div>
    <div className={`${styles.shimmer} ${styles.value}`} />
  </div>
);

PredictedPlayerPlaceholderRow.displayName = 'PredictedPlayerPlaceholderRow';
