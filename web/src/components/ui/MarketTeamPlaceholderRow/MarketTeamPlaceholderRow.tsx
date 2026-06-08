import React from 'react';

import styles from './MarketTeamPlaceholderRow.module.css';

export interface MarketTeamPlaceholderRowProps {
  rank: number;
}

export const MarketTeamPlaceholderRow: React.FC<MarketTeamPlaceholderRowProps> = ({ rank }) => (
  <div className={styles.row} aria-hidden="true">
    <span className={styles.rank}>{rank}</span>
    <div className={`${styles.shimmer} ${styles.badge}`} />
    <div className={styles.info}>
      <div className={`${styles.shimmer} ${styles.name}`} />
      <div className={`${styles.shimmer} ${styles.fixture}`} />
    </div>
    <div className={`${styles.shimmer} ${styles.value}`} />
  </div>
);

MarketTeamPlaceholderRow.displayName = 'MarketTeamPlaceholderRow';
