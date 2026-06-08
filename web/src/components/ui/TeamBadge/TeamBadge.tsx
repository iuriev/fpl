import React, { useCallback, useState } from 'react';

import { teamBadgeUrl } from '@/lib/team-badge-url';

import styles from './TeamBadge.module.css';

export interface TeamBadgeProps {
  teamCode: number;
  shortName: string;
  className?: string;
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({ teamCode, shortName, className }) => {
  const [failed, setFailed] = useState(false);

  const handleError = useCallback(() => {
    setFailed(true);
  }, []);

  if (failed) {
    return <span className={styles.fallback}>{shortName}</span>;
  }

  return (
    <img
      src={teamBadgeUrl(teamCode)}
      alt=""
      aria-hidden="true"
      className={`${styles.badge} ${className ?? ''}`}
      draggable={false}
      onError={handleError}
    />
  );
};

TeamBadge.displayName = 'TeamBadge';
