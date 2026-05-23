import React from 'react';
import { Link } from 'react-router-dom';

import { copy } from '@/lib/copy';
import type { EntryResponse } from '@/types';

import styles from './TeamInfoPanel.module.css';

function isoToFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.codePointAt(0)! - 65 + 0x1f1e6))
    .join('');
}

function fmt(n: number): string {
  return n.toLocaleString('en-GB');
}

export interface TeamInfoPanelProps {
  entry: EntryResponse;
  teamId: number;
}

export const TeamInfoPanel: React.FC<TeamInfoPanelProps> = ({ entry, teamId }) => {
  const flag = entry.regionIsoCode ? isoToFlag(entry.regionIsoCode) : null;

  return (
    <aside className={styles.panel}>
      <div className={styles.avatarWrap} aria-hidden="true">
        <div className={styles.avatar} />
      </div>

      <div className={styles.identity}>
        <span className={styles.teamName}>{entry.teamName}</span>
        <span className={styles.manager}>
          {flag && <span aria-hidden="true">{flag} </span>}
          {entry.managerName}
        </span>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{fmt(entry.overallPoints)}</span>
          <span className={styles.statLabel}>{copy.teamInfoOverallPts}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{fmt(entry.overallRank)}</span>
          <span className={styles.statLabel}>{copy.teamInfoOverallRank}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{fmt(entry.eventPoints)}</span>
          <span className={styles.statLabel}>{copy.teamInfoGwPts}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{fmt(entry.totalPlayers)}</span>
          <span className={styles.statLabel}>{copy.teamInfoTotalPlayers}</span>
        </div>
      </div>

      <div className={styles.navLinks}>
        <Link to={`/history?teamId=${teamId}`} className={styles.navLink}>
          {copy.teamInfoGwHistory}
        </Link>
        <Link to={`/stats?teamId=${teamId}`} className={styles.navLink}>
          {copy.statsMyStats}
        </Link>
      </div>
    </aside>
  );
};

TeamInfoPanel.displayName = 'TeamInfoPanel';
