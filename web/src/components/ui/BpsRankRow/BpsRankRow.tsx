import React from 'react';

import { Jersey } from '@/components/ui/Jersey/Jersey';
import { PositionBadge } from '@/components/ui/PositionBadge/PositionBadge';
import { PriceMetricTiles } from '@/components/ui/PriceMetricTiles/PriceMetricTiles';
import { copy } from '@/lib/copy';
import type { LeaderboardPlayer } from '@/types';

import styles from './BpsRankRow.module.css';

export interface BpsRankRowProps {
  rank: number;
  player: LeaderboardPlayer;
  variant: 'defcon' | 'bps';
}

export const BpsRankRow: React.FC<BpsRankRowProps> = ({ rank, player, variant }) => {
  return (
    <div className={styles.row}>
      <span className={styles.rank}>{rank}</span>
      <Jersey size="medium" teamCode={player.teamCode} position={player.position} alt="" />
      <div className={styles.info}>
        <span className={styles.name}>{player.webName}</span>
        <span className={styles.meta}>
          <PositionBadge position={player.position} />
          <span className={styles.club}>{player.teamShortName}</span>
        </span>
      </div>
      <PriceMetricTiles
        nowCost={player.nowCost}
        expectedPoints={String(player.value)}
        expectedPointsLabel={
          variant === 'bps' ? copy.topPlayersTabBps : copy.topPlayersTabDefcon
        }
        metricTone={variant}
      />
    </div>
  );
};

BpsRankRow.displayName = 'BpsRankRow';
