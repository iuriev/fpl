import React from 'react';

import { Jersey } from '@/components/ui/Jersey/Jersey';
import { PlayerPredictionBreakdown } from '@/components/ui/PlayerPredictionBreakdown/PlayerPredictionBreakdown';
import { PositionBadge } from '@/components/ui/PositionBadge/PositionBadge';
import { PriceMetricTiles } from '@/components/ui/PriceMetricTiles/PriceMetricTiles';
import { copy } from '@/lib/copy';
import { formatPriceTenths } from '@/lib/format-price';
import type { PredictedPointsRowData } from '@/lib/predicted-points';

import styles from './PredictedPointsRow.module.css';

export interface PredictedPointsRowProps {
  rank: number;
  row: PredictedPointsRowData;
  onSelect: (playerId: number) => void;
}

export const PredictedPointsRow: React.FC<PredictedPointsRowProps> = ({
  rank,
  row,
  onSelect,
}) => {
  const { player, xPts, prediction } = row;

  return (
    <button
      type="button"
      className={styles.row}
      onClick={() => onSelect(player.id)}
      aria-label={`${player.webName}, ${formatPriceTenths(player.nowCost)}, ${xPts.toFixed(1)} ${copy.predictedPointsXptsLabel}`}
    >
      <span className={styles.rank}>{rank}</span>
      <Jersey size="medium" teamCode={player.teamCode} position={player.position} alt="" />
      <div className={styles.info}>
        <span className={styles.name}>{player.webName}</span>
        <span className={styles.meta}>
          <PositionBadge position={player.position} />
          <span className={styles.club}>{player.teamShortName}</span>
        </span>
        {prediction && <PlayerPredictionBreakdown prediction={prediction} />}
      </div>
      <PriceMetricTiles
        nowCost={player.nowCost}
        expectedPoints={xPts.toFixed(1)}
        expectedPointsLabel={copy.predictedPointsXptsLabel}
      />
    </button>
  );
};

PredictedPointsRow.displayName = 'PredictedPointsRow';
