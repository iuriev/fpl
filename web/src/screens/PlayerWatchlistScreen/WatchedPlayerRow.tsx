import React, { useMemo } from 'react';

import { usePlayerPool, usePlayersLive } from '@/api/queries';
import { PlayerRankRow } from '@/components/ui/PlayerRankRow/PlayerRankRow';
import { copy } from '@/lib/copy';
import type { TopPlayersPlayer } from '@/types';

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
  const liveQuery = usePlayersLive(currentGw, [playerId]);
  const poolQuery = usePlayerPool();

  const player = useMemo((): TopPlayersPlayer | null => {
    const livePlayer = liveQuery.data?.players.find((p) => p.id === playerId);
    if (livePlayer) return livePlayer;
    const poolPlayer = poolQuery.data?.players.find((p) => p.id === playerId);
    if (poolPlayer) {
      return {
        id: poolPlayer.id,
        webName: poolPlayer.webName,
        position: poolPlayer.position,
        teamCode: poolPlayer.teamCode,
        teamShortName: poolPlayer.teamShortName,
        points: currentGw !== null ? poolPlayer.eventPoints : poolPlayer.totalPoints,
        selectedByPercent: poolPlayer.selectedByPercent,
      };
    }
    return null;
  }, [liveQuery.data, poolQuery.data, playerId, currentGw]);

  const isLoading = liveQuery.isLoading || poolQuery.isLoading;

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

  return <PlayerRankRow rank={rank} player={player} onFollow={onRemove} isFollowing={true} />;
};

WatchedPlayerRow.displayName = 'WatchedPlayerRow';
