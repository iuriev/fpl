import React from 'react';

import { Jersey } from '@/components/ui/Jersey/Jersey';
import { PositionBadge } from '@/components/ui/PositionBadge/PositionBadge';
import type { LeaderboardPlayer } from '@/types';

import styles from './BpsRankRow.module.css';

export interface BpsRankRowProps {
  rank: number;
  player: LeaderboardPlayer;
  variant: 'defcon' | 'bps';
}

export const BpsRankRow: React.FC<BpsRankRowProps> = ({ rank, player, variant }) => {
  const price = `£${(player.nowCost / 10).toFixed(1)}m`;
  const badgeClass = variant === 'bps' ? styles.badge_bps : styles.badge_defcon;

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
      <span className={styles.price}>{price}</span>
      <div className={`${styles.badge} ${badgeClass}`}>
        <span className={styles.badgeValue}>{player.value}</span>
        <span className={styles.badgeLabel}>BPS</span>
      </div>
    </div>
  );
};

BpsRankRow.displayName = 'BpsRankRow';
