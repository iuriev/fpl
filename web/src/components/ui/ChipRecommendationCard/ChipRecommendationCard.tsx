import React from 'react';

import type { ChipRecommendation } from '@/types';

import styles from './ChipRecommendationCard.module.css';

const CHIP_LABELS: Record<ChipRecommendation['chip'], string> = {
  wildcard: 'Wildcard',
  freehit: 'Free Hit',
  bboost: 'Bench Boost',
  '3xc': 'Triple Captain',
};

const CHIP_ABBR: Record<ChipRecommendation['chip'], string> = {
  wildcard: 'WC',
  freehit: 'FH',
  bboost: 'BB',
  '3xc': 'TC',
};

function gwBadgeClass(rec: ChipRecommendation): string {
  if (rec.isDgw) return `${styles.gwBadge} ${styles.gwBadgeDgw}`;
  if (rec.isBgw) return `${styles.gwBadge} ${styles.gwBadgeBgw}`;
  return `${styles.gwBadge} ${styles.gwBadgeNormal}`;
}

function gwLabel(rec: ChipRecommendation): string {
  const base = `GW ${rec.recommendedGw}`;
  if (rec.isDgw) return `${base} DGW`;
  if (rec.isBgw) return `${base} BGW`;
  return base;
}

interface Props {
  recommendation: ChipRecommendation;
}

export const ChipRecommendationCard: React.FC<Props> = ({ recommendation: rec }) => {
  const chipClass = `${styles.card} ${styles[`chip-${rec.chip === '3xc' ? 'tc' : rec.chip === 'freehit' ? 'fh' : rec.chip === 'bboost' ? 'bb' : 'wc'}`]}`;
  const isUsed = rec.status === 'used';
  const isActive = rec.status === 'active';

  return (
    <div className={`${chipClass}${isUsed ? ` ${styles.cardUsed}` : ''}${isActive ? ` ${styles.cardActive}` : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.abbr}>{CHIP_ABBR[rec.chip]}</span>
          <span className={styles.label}>{CHIP_LABELS[rec.chip]}</span>
        </div>
        {rec.status === 'recommended' && rec.recommendedGw != null && (
          <span className={gwBadgeClass(rec)}>{gwLabel(rec)}</span>
        )}
        {isUsed && (
          <span className={`${styles.gwBadge} ${styles.gwBadgeUsed}`}>
            Used GW {rec.usedInGw}
          </span>
        )}
        {isActive && (
          <span className={`${styles.gwBadge} ${styles.gwBadgeActive}`}>Active</span>
        )}
      </div>

      {rec.status === 'recommended' && (
        <>
          <div className={styles.metrics}>
            {rec.metrics.map((m) => (
              <div key={m.label} className={styles.metric}>
                <span className={styles.metricValue}>{m.value}</span>
                <span className={styles.metricLabel}>{m.label}</span>
              </div>
            ))}
          </div>
          {rec.rationale && <p className={styles.rationale}>{rec.rationale}</p>}
        </>
      )}
    </div>
  );
};
