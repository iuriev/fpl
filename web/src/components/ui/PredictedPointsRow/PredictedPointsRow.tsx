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
  onSelect?: (playerId: number) => void;
}

export const PredictedPointsRow: React.FC<PredictedPointsRowProps> = ({
  rank,
  row,
  onSelect,
}) => {
  const { player, displayValue, displayLabel, prediction } = row;
  const Tag = onSelect ? 'button' : 'div';

  return (
    <Tag
      {...(onSelect ? { type: 'button' as const, onClick: () => onSelect(player.id) } : {})}
      className={styles.row}
      aria-label={`${player.webName}, ${formatPriceTenths(player.nowCost)}, ${displayValue.toFixed(1)} ${displayLabel}`}
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
        expectedPoints={displayValue.toFixed(1)}
        expectedPointsLabel={displayLabel}
      />
    </Tag>
  );
};

PredictedPointsRow.displayName = 'PredictedPointsRow';
