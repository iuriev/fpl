import React from 'react';

import { TeamBadge } from '@/components/ui/TeamBadge/TeamBadge';
import { copy, interpolate } from '@/lib/copy';
import type { TeamMarketDto } from '@/types';

import styles from './MarketTeamRow.module.css';

export type MarketTeamTab = 'cs' | 'xg';

export interface MarketTeamRowProps {
  team: TeamMarketDto;
  rank: number;
  tab: MarketTeamTab;
  maxValue: number;
}

function fixtureLabel(team: TeamMarketDto): string | null {
  if (team.fixtures.length === 0) return null;
  return team.fixtures
    .map((f) => interpolate(copy.marketVsOpponent, { opponent: f.opponentShortName }))
    .join(', ');
}

export const MarketTeamRow: React.FC<MarketTeamRowProps> = ({ team, rank, tab, maxValue }) => {
  const value = tab === 'cs' ? team.csProb : team.xG;
  const displayValue = tab === 'cs' ? `${(value * 100).toFixed(0)}%` : value.toFixed(2);
  const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const opponent = fixtureLabel(team);

  return (
    <div
      className={styles.row}
      aria-label={`${team.teamShortName}${opponent ? ` ${opponent}` : ''}, ${displayValue}`}
    >
      <span className={styles.rank}>{rank}</span>
      <div className={styles.badgeWrap}>
        <TeamBadge teamCode={team.teamCode} shortName={team.teamShortName} />
      </div>
      <div className={styles.teamInfo}>
        <span className={styles.teamName}>{team.teamShortName}</span>
        {opponent && <span className={styles.fixture}>{opponent}</span>}
      </div>
      <div className={styles.valueCol}>
        <span className={styles.value}>{displayValue}</span>
        <div className={styles.barTrack}>
          <div className={styles.barFill} style={{ width: `${barWidth}%` }} />
        </div>
      </div>
    </div>
  );
};

MarketTeamRow.displayName = 'MarketTeamRow';
