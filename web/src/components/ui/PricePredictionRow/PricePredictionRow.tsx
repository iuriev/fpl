import React from 'react';

import { Jersey } from '@/components/ui/Jersey/Jersey';
import { PositionBadge } from '@/components/ui/PositionBadge/PositionBadge';
import { PriceMetricTiles } from '@/components/ui/PriceMetricTiles/PriceMetricTiles';
import { copy, interpolate } from '@/lib/copy';
import { formatTransferCount } from '@/lib/format-price';
import type { PricePredictionPlayer } from '@/types';

import styles from './PricePredictionRow.module.css';

export interface PricePredictionRowProps {
  rank: number;
  player: PricePredictionPlayer;
  onSelect?: (playerId: number) => void;
}

function likelihoodLabel(likelihood: PricePredictionPlayer['likelihood']): string {
  if (likelihood === 'very_likely') return copy.priceChangesLikelihoodVeryLikely;
  return copy.priceChangesLikelihoodLikely;
}

export const PricePredictionRow: React.FC<PricePredictionRowProps> = ({
  rank,
  player,
  onSelect,
}) => {
  const rising = player.netTransfersEvent > 0;
  const Tag = onSelect ? 'button' : 'div';

  return (
    <Tag
      {...(onSelect ? { type: 'button' as const, onClick: () => onSelect(player.id) } : {})}
      className={styles.row}
      aria-label={`${player.webName}, ${likelihoodLabel(player.likelihood)}`}
    >
      <span className={styles.rank}>{rank}</span>
      <Jersey size="medium" teamCode={player.teamCode} position={player.position} alt="" />
      <div className={styles.info}>
        <span className={styles.name}>{player.webName}</span>
        <span className={styles.meta}>
          <PositionBadge position={player.position} />
          <span className={styles.club}>{player.teamShortName}</span>
        </span>
        <span className={styles.transfers}>
          {player.transferInPercent != null
            ? interpolate(copy.priceChangesTransferInPct, { n: player.transferInPercent })
            : rising
              ? interpolate(copy.priceChangesTransfersIn, {
                  n: formatTransferCount(player.transfersInEvent),
                })
              : interpolate(copy.priceChangesTransfersOut, {
                  n: formatTransferCount(player.transfersOutEvent),
                })}
        </span>
      </div>
      <PriceMetricTiles
        nowCost={player.nowCost}
        secondaryLabel={likelihoodLabel(player.likelihood)}
        secondaryVariant={player.likelihood === 'very_likely' ? 'very_likely' : 'likely'}
      />
    </Tag>
  );
};

PricePredictionRow.displayName = 'PricePredictionRow';
