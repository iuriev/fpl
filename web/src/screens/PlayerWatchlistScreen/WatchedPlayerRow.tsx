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

  const liveReady = currentGw !== null && liveQuery.isFetched;

  const player = useMemo((): TopPlayersPlayer | null => {
    if (!liveReady) return null;

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
  }, [liveReady, liveQuery.data, poolQuery.data, playerId, currentGw]);

  if (currentGw === null || !liveReady) {
    return <WatchedPlayerRowSkeleton rank={rank} />;
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

function WatchedPlayerRowSkeleton({ rank }: { rank: number }) {
  return (
    <div
      className={styles.skeleton}
      aria-busy="true"
      aria-label={copy.loadingPlaceholder}
    >
      <span className={styles.skeletonRank}>{rank}</span>
      <div className={`${styles.skeletonCell} ${styles.skeletonJersey}`} />
      <div className={styles.skeletonInfo}>
        <div className={`${styles.skeletonCell} ${styles.skeletonName}`} />
        <div className={styles.skeletonMetaRow}>
          <div className={`${styles.skeletonCell} ${styles.skeletonBadge}`} />
          <div className={`${styles.skeletonCell} ${styles.skeletonClub}`} />
        </div>
        <div className={styles.skeletonChips}>
          <div className={`${styles.skeletonCell} ${styles.skeletonChip}`} />
          <div className={`${styles.skeletonCell} ${styles.skeletonChip}`} />
        </div>
        <div className={`${styles.skeletonCell} ${styles.skeletonOwnership}`} />
      </div>
      <div className={`${styles.skeletonCell} ${styles.skeletonPoints}`} />
      <div className={`${styles.skeletonCell} ${styles.skeletonFollow}`} />
    </div>
  );
}

WatchedPlayerRow.displayName = 'WatchedPlayerRow';
