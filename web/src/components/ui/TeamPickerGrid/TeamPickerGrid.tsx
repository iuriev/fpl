import React from 'react';

import { TeamBadge } from '@/components/ui/TeamBadge/TeamBadge';

import styles from './TeamPickerGrid.module.css';

export interface TeamPickerTeam {
  teamId: number;
  teamCode: number;
  shortName: string;
}

export interface TeamPickerGridProps {
  teams: TeamPickerTeam[];
  selectedTeamId: number | null;
  onSelectTeam: (teamId: number) => void;
  ariaLabel: string;
}

export const TeamPickerGrid: React.FC<TeamPickerGridProps> = ({
  teams,
  selectedTeamId,
  onSelectTeam,
  ariaLabel,
}) => (
  <div className={styles.grid} role="tablist" aria-label={ariaLabel}>
    {teams.map((team) => (
      <button
        key={team.teamId}
        type="button"
        role="tab"
        aria-selected={team.teamId === selectedTeamId}
        aria-label={team.shortName}
        className={`${styles.chip} ${team.teamId === selectedTeamId ? styles.chipActive : ''}`}
        onClick={() => onSelectTeam(team.teamId)}
      >
        <span className={styles.badgeWrap}>
          <TeamBadge teamCode={team.teamCode} shortName={team.shortName} />
        </span>
      </button>
    ))}
  </div>
);

TeamPickerGrid.displayName = 'TeamPickerGrid';
