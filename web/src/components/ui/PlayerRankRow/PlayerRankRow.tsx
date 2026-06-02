import React from 'react';

import { Jersey } from '@/components/ui/Jersey/Jersey';
import { PositionBadge } from '@/components/ui/PositionBadge/PositionBadge';
import { chipColorKey, formatStatLabel, HIDDEN_STATS } from '@/lib/stat-chips';
import type { StatEntry, TopPlayersPlayer } from '@/types';

import styles from './PlayerRankRow.module.css';

export interface PlayerRankRowProps {
  rank: number;
  player: TopPlayersPlayer;
}

function chipColorClass(identifier: string): string {
  const key = chipColorKey(identifier);
  return styles[key as keyof typeof styles] ?? styles.chipNegative;
}

function visibleStats(breakdown: StatEntry[]): StatEntry[] {
  return breakdown.filter((s) => !HIDDEN_STATS.has(s.identifier) && s.value !== 0);
}

export const PlayerRankRow: React.FC<PlayerRankRowProps> = ({ rank, player }) => {
  const chips = player.statBreakdown ? visibleStats(player.statBreakdown) : [];

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
        {chips.length > 0 && (
          <div className={styles.statChips}>
            {chips.map((s) => (
              <span key={s.identifier} className={`${styles.chip} ${chipColorClass(s.identifier)}`}>
                {formatStatLabel(s.identifier, s.value, s.points)}
              </span>
            ))}
          </div>
        )}
        {player.selectedByPercent && (
          <span className={styles.ownership}>{player.selectedByPercent}% ownership</span>
        )}
      </div>
      <span className={styles.points}>{player.points}</span>
    </div>
  );
};

PlayerRankRow.displayName = 'PlayerRankRow';
