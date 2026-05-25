import React from 'react';

import { Jersey } from '@/components/ui/Jersey/Jersey';
import { PositionBadge } from '@/components/ui/PositionBadge/PositionBadge';
import type { TopPlayersPlayer } from '@/types';

import styles from './PlayerRankRow.module.css';

export interface PlayerRankRowProps {
  rank: number;
  player: TopPlayersPlayer;
}

export const PlayerRankRow: React.FC<PlayerRankRowProps> = ({ rank, player }) => {
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
      <span className={styles.points}>{player.points}</span>
    </div>
  );
};

PlayerRankRow.displayName = 'PlayerRankRow';
