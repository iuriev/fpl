import React from 'react';

import { copy } from '@/lib/copy';
import { formatCsProb, formatPredictionDecimal } from '@/lib/predicted-points';
import type { PlayerGameweekPrediction, PredictionConfidence } from '@/types';

import styles from './PlayerPredictionBreakdown.module.css';

export interface PlayerPredictionBreakdownProps {
  prediction: PlayerGameweekPrediction;
}

const CONFIDENCE_LABEL: Record<PredictionConfidence, string> = {
  low: copy.predictedPointsConfidenceLow,
  medium: copy.predictedPointsConfidenceMedium,
  high: copy.predictedPointsConfidenceHigh,
};

export const PlayerPredictionBreakdown: React.FC<PlayerPredictionBreakdownProps> = ({
  prediction,
}) => {
  const confidenceLabel = CONFIDENCE_LABEL[prediction.confidence];

  return (
    <div className={styles.breakdown}>
      <span className={styles.metrics} aria-label={copy.predictedPointsBreakdownAria}>
        <span>
          {copy.predictedPointsXGLabel} {formatPredictionDecimal(prediction.xGoals)}
        </span>
        <span className={styles.sep} aria-hidden="true">
          ·
        </span>
        <span>
          {copy.predictedPointsXALabel} {formatPredictionDecimal(prediction.xAssists)}
        </span>
        <span className={styles.sep} aria-hidden="true">
          ·
        </span>
        <span>
          {copy.predictedPointsCSLabel} {formatCsProb(prediction.csProb)}
        </span>
        <span className={styles.sep} aria-hidden="true">
          ·
        </span>
        <span>
          {copy.predictedPointsDefconLabel}{' '}
          {formatPredictionDecimal(prediction.defconPts)}
        </span>
      </span>
      <span
        className={`${styles.confidence} ${styles[`confidence_${prediction.confidence}`]}`}
        title={confidenceLabel}
      >
        {confidenceLabel}
      </span>
    </div>
  );
};

PlayerPredictionBreakdown.displayName = 'PlayerPredictionBreakdown';
