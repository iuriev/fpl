import React from 'react';

import { formatChangeTenths, formatPriceTenths } from '@/lib/format-price';

import styles from './PriceMetricTiles.module.css';

export interface PriceMetricTilesProps {
  nowCost: number;
  changeAmount?: number;
  secondaryLabel?: string;
  secondaryVariant?: 'likely' | 'very_likely';
  expectedPoints?: string;
  expectedPointsLabel?: string;
  metricTone?: 'accent' | 'bps' | 'defcon';
}

export const PriceMetricTiles: React.FC<PriceMetricTilesProps> = ({
  nowCost,
  changeAmount,
  secondaryLabel,
  secondaryVariant = 'likely',
  expectedPoints,
  expectedPointsLabel,
  metricTone = 'accent',
}) => {
  const rising = changeAmount != null && changeAmount > 0;
  const falling = changeAmount != null && changeAmount < 0;
  const metricToneClass =
    metricTone === 'bps'
      ? styles.tileXpts_bps
      : metricTone === 'defcon'
        ? styles.tileXpts_defcon
        : '';

  return (
    <div className={styles.group} aria-hidden="true">
      <span className={styles.tilePrice}>{formatPriceTenths(nowCost)}</span>
      {expectedPoints != null && (
        <span className={`${styles.tileXpts} ${metricToneClass}`}>
          <span className={styles.tileXptsValue}>{expectedPoints}</span>
          {expectedPointsLabel && (
            <span className={styles.tileXptsLabel}>{expectedPointsLabel}</span>
          )}
        </span>
      )}
      {changeAmount != null && changeAmount !== 0 && (
        <span
          className={`${styles.tileChange} ${rising ? styles.tileChangeUp : ''} ${
            falling ? styles.tileChangeDown : ''
          }`}
        >
          {formatChangeTenths(changeAmount)}
        </span>
      )}
      {secondaryLabel && (
        <span
          className={`${styles.tileSecondary} ${
            secondaryVariant === 'very_likely' ? styles.tileSecondaryStrong : ''
          }`}
        >
          {secondaryLabel}
        </span>
      )}
    </div>
  );
};

PriceMetricTiles.displayName = 'PriceMetricTiles';
