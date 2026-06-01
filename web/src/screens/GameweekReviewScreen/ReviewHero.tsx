import React from 'react';

import { ChipBadge } from '@/components/ui/ChipBadge/ChipBadge';
import { copy } from '@/lib/copy';
import type { ActiveChip } from '@/types';

import styles from './ReviewHero.module.css';

export interface ReviewHeroProps {
  gwNumber: number;
  gwPoints: number;
  overallRank: number;
  previousOverallRank: number | undefined;
  gwRank: number;
  averageScore: number | undefined;
  highestScore: number | undefined;
  activeChip: ActiveChip;
}

function formatRank(n: number): string {
  return n.toLocaleString('en-GB');
}

export const ReviewHero: React.FC<ReviewHeroProps> = ({
  gwPoints,
  overallRank,
  previousOverallRank,
  gwRank,
  averageScore,
  highestScore,
  activeChip,
}) => {
  const rankDelta =
    previousOverallRank !== undefined ? previousOverallRank - overallRank : null;
  const rankUp = rankDelta !== null && rankDelta > 0;
  const rankDown = rankDelta !== null && rankDelta < 0;

  return (
    <div className={styles.hero}>
      <div className={styles.top}>
        <div className={styles.ptsBlock}>
          <span className={styles.pts}>{gwPoints}</span>
          <span className={styles.ptsLabel}>{copy.reviewGwPts}</span>
        </div>
        <div className={styles.rankBlock}>
          {rankDelta !== null && (
            <span
              className={`${styles.rankChange} ${rankUp ? styles.rankUp : ''} ${rankDown ? styles.rankDown : ''}`}
            >
              {rankUp ? '↑' : rankDown ? '↓' : '—'}
              {rankDelta !== 0 ? ` ${formatRank(Math.abs(rankDelta))}` : ''}
            </span>
          )}
          <span className={styles.rankSub}>Overall: {formatRank(overallRank)}</span>
        </div>
      </div>

      <div className={styles.chips}>
        {averageScore !== undefined && (
          <>
            <span
              className={`${styles.chip} ${gwPoints > averageScore ? styles.chipGood : styles.chipNeutral}`}
            >
              <span>{copy.reviewVsAvg}</span>
              <span className={styles.chipVal}>
                {gwPoints > averageScore ? '+' : ''}
                {gwPoints - averageScore}
              </span>
            </span>
            <span className={`${styles.chip} ${styles.chipNeutral}`}>
              <span>{copy.reviewAvg}</span>
              <span className={styles.chipVal}>{averageScore}</span>
            </span>
          </>
        )}
        {highestScore !== undefined && (
          <span className={`${styles.chip} ${styles.chipNeutral}`}>
            <span>{copy.reviewHighest}</span>
            <span className={styles.chipVal}>{highestScore}</span>
          </span>
        )}
        <span className={`${styles.chip} ${styles.chipNeutral}`}>
          <span>{copy.reviewGwRank}</span>
          <span className={styles.chipVal}>{formatRank(gwRank)}</span>
        </span>
        {activeChip && (
          <span className={styles.chipBadgeWrap}>
            <ChipBadge chip={activeChip} />
          </span>
        )}
      </div>
    </div>
  );
};

ReviewHero.displayName = 'ReviewHero';
