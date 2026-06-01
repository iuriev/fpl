import React from 'react';

import { copy, interpolate } from '@/lib/copy';

import type { TransferPair } from './review-helpers';
import styles from './ReviewTransfers.module.css';

export interface ReviewTransfersProps {
  transferPairs: TransferPair[];
  transferCost: number;
  transfers: number;
}

export const ReviewTransfers: React.FC<ReviewTransfersProps> = ({
  transferPairs,
  transferCost,
  transfers,
}) => {
  return (
    <div className={styles.section}>
      <span className={styles.sectionLabel}>{copy.reviewTransfersSection}</span>

      {transfers === 0 ? (
        <p className={styles.noTransfers}>{copy.reviewNoTransfers}</p>
      ) : (
        <>
          {transferPairs.map((pair, i) => {
            const delta = pair.in.gwPoints - pair.out.gwPoints;
            return (
              <div key={i} className={styles.row}>
                <div className={`${styles.card} ${styles.cardOut}`}>
                  <span className={styles.cardDir}>{copy.reviewTransferOut}</span>
                  <span className={styles.cardName}>{pair.out.name}</span>
                  <span className={styles.cardPts}>{pair.out.gwPoints}</span>
                </div>
                <span className={styles.arrow} aria-hidden="true">
                  →
                </span>
                <div className={`${styles.card} ${styles.cardIn}`}>
                  <span className={styles.cardDir}>{copy.reviewTransferIn}</span>
                  <span className={styles.cardName}>{pair.in.name}</span>
                  <span className={styles.cardPts}>{pair.in.gwPoints}</span>
                </div>
                <span
                  className={`${styles.delta} ${delta >= 0 ? styles.deltaPos : styles.deltaNeg}`}
                >
                  {delta >= 0 ? '+' : ''}
                  {delta}
                </span>
              </div>
            );
          })}
          {transferCost > 0 && (
            <p className={styles.hitNote}>
              {interpolate(copy.reviewTransferHit, { cost: transferCost })}
            </p>
          )}
        </>
      )}
    </div>
  );
};

ReviewTransfers.displayName = 'ReviewTransfers';
