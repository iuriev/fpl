import React from 'react';

import { Jersey } from '@/components/ui/Jersey/Jersey';
import { PositionBadge } from '@/components/ui/PositionBadge/PositionBadge';
import { PriceMetricTiles } from '@/components/ui/PriceMetricTiles/PriceMetricTiles';
import { copy, interpolate } from '@/lib/copy';
import { formatChangeTenths, formatPriceTenths, formatTransferCount } from '@/lib/format-price';
import type { PriceChangePlayer } from '@/types';

import styles from './PriceChangeRow.module.css';

export interface PriceChangeRowProps {
  rank: number;
  player: PriceChangePlayer;
  onSelect?: (playerId: number) => void;
}

export const PriceChangeRow: React.FC<PriceChangeRowProps> = ({ rank, player, onSelect }) => {
  const rising = player.changeAmount > 0;
  const Tag = onSelect ? 'button' : 'div';

  return (
    <Tag
      {...(onSelect ? { type: 'button' as const, onClick: () => onSelect(player.id) } : {})}
      className={styles.row}
      aria-label={`${player.webName}, ${formatPriceTenths(player.nowCost)}, ${formatChangeTenths(player.changeAmount)}`}
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
          {rising
            ? interpolate(copy.priceChangesTransfersIn, {
                n: formatTransferCount(player.transfersInEvent),
              })
            : interpolate(copy.priceChangesTransfersOut, {
                n: formatTransferCount(player.transfersOutEvent),
              })}
        </span>
      </div>
      <PriceMetricTiles nowCost={player.nowCost} changeAmount={player.changeAmount} />
    </Tag>
  );
};

PriceChangeRow.displayName = 'PriceChangeRow';
