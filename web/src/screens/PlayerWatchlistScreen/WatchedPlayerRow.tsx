import React, { useMemo } from 'react';

import { useTopPlayersGw, useTopPlayersSeason } from '@/api/queries';
import { PlayerRankRow } from '@/components/ui/PlayerRankRow/PlayerRankRow';
import { copy } from '@/lib/copy';

import styles from './WatchedPlayerRow.module.css';

export interface WatchedPlayerRowProps {
  rank: number;
  playerId: number;
  currentGw: number | null;
  onRemove: () => void;
}

export const WatchedPlayerRow: React.FC<WatchedPlayerRowProps> = ({
  rank,
  playerId,
  currentGw,
  onRemove,
}) => {
  const gwQuery = useTopPlayersGw(currentGw);
  const seasonQuery = useTopPlayersSeason();

  const player = useMemo(() => {
    const gwPlayer = gwQuery.data?.players.find((p) => p.id === playerId);
    if (gwPlayer) return gwPlayer;
    return seasonQuery.data?.players.find((p) => p.id === playerId) ?? null;
  }, [gwQuery.data, seasonQuery.data, playerId]);

  const isLoading = gwQuery.isLoading || seasonQuery.isLoading;

  if (isLoading && !player) {
    return (
      <div className={styles.skeleton} aria-busy="true">
        <span className={styles.skeletonRank}>{rank}</span>
        <div className={styles.skeletonJersey} />
        <div className={styles.skeletonInfo}>
          <div className={styles.skeletonName} />
          <div className={styles.skeletonMeta} />
        </div>
        <div className={styles.skeletonPoints} />
      </div>
    );
  }

  if (!player) {
    return (
      <div className={styles.unknown}>
        <span className={styles.unknownRank}>{rank}</span>
        <span className={styles.unknownId}>Player #{playerId}</span>
        <button
          className={styles.removeBtn}
          onClick={onRemove}
          aria-label={copy.playerWatchlistRemove}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className={styles.row}>
      <PlayerRankRow rank={rank} player={player} />
      <button
        className={styles.removeBtn}
        onClick={onRemove}
        aria-label={copy.playerWatchlistRemove}
      >
        ✕
      </button>
    </div>
  );
};

WatchedPlayerRow.displayName = 'WatchedPlayerRow';
