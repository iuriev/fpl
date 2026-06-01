import React from 'react';

import { copy, interpolate } from '@/lib/copy';
import type { SquadPlayer } from '@/types';

import styles from './ReviewBench.module.css';

export interface ReviewBenchProps {
  bench: SquadPlayer[];
  pointsOnBench: number;
}

export const ReviewBench: React.FC<ReviewBenchProps> = ({ bench, pointsOnBench }) => {
  const calloutMod =
    pointsOnBench >= 10
      ? styles.calloutHigh
      : pointsOnBench >= 4
        ? styles.calloutMid
        : styles.calloutLow;

  return (
    <div className={styles.section}>
      <span className={styles.sectionLabel}>{copy.reviewBenchSection}</span>

      <div className={`${styles.callout} ${calloutMod}`}>
        <span className={styles.calloutIcon} aria-hidden="true">
          {pointsOnBench >= 4 ? '😬' : '😌'}
        </span>
        <div className={styles.calloutText}>
          <span className={styles.calloutTitle}>
            {pointsOnBench > 0
              ? interpolate(copy.reviewBenchWasted, { pts: pointsOnBench })
              : copy.reviewBenchNone}
          </span>
          <span className={styles.calloutSub}>{copy.reviewNoAutosubs}</span>
        </div>
      </div>

      <div className={styles.players}>
        {bench.map((p) => (
          <div key={p.id} className={styles.playerChip}>
            <span className={styles.playerName}>{p.name}</span>
            <span className={`${styles.playerPts} ${p.points >= 4 ? styles.playerPtsWarm : ''}`}>
              {p.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

ReviewBench.displayName = 'ReviewBench';
