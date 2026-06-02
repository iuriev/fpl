import React from 'react';

import type { StandingEntry } from '@/types';

import { getLeagueRankDirection } from '../LeaguesStatsScreen/leagues-helpers';
import styles from './StandingRow.module.css';

const DIR_SYMBOL = { up: '↑', down: '↓', neutral: '—' };
const DIR_CLASS = {
  up: styles.dirUp,
  down: styles.dirDown,
  neutral: styles.dirNeutral,
};

export interface StandingRowProps {
  standing: StandingEntry;
  onClick: () => void;
}

export function StandingRow({ standing, onClick }: StandingRowProps) {
  const dir = getLeagueRankDirection(standing.rank, standing.lastRank);
  return (
    <button className={styles.row} onClick={onClick} type="button">
      <span className={styles.rank}>{standing.rank}</span>
      <span className={styles.nameBlock}>
        <span className={styles.playerName}>{standing.playerName}</span>
        <span className={styles.entryName}>{standing.entryName}</span>
      </span>
      <span className={styles.gw}>{standing.eventTotal}</span>
      <span className={styles.total}>{standing.total}</span>
      <span className={`${styles.dir} ${DIR_CLASS[dir]}`} aria-label={dir}>
        {DIR_SYMBOL[dir]}
      </span>
    </button>
  );
}

StandingRow.displayName = 'StandingRow';
