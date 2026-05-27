import React, { useCallback, useState } from 'react';

import type { PlayerPosition } from '@/types';

import styles from './Jersey.module.css';

const FPL_SHIRTS_CDN = 'https://fantasy.premierleague.com/dist/img/shirts/standard';

export interface JerseyProps {
  size?: 'large' | 'medium';
  teamCode?: number;
  position?: PlayerPosition;
  alt?: string;
}

function shirtUrl(teamCode: number, position: PlayerPosition): string {
  const variant = position === 'GK' ? '_1' : '';
  return `${FPL_SHIRTS_CDN}/shirt_${teamCode}${variant}-66.png`;
}

export const Jersey: React.FC<JerseyProps> = ({
  size = 'large',
  teamCode,
  position = 'MID',
  alt = 'Player jersey',
}) => {
  const [src, setSrc] = useState<string>(
    teamCode ? shirtUrl(teamCode, position) : '/shirts/placeholder.svg'
  );

  const handleError = useCallback(() => {
    setSrc('/shirts/placeholder.svg');
  }, []);

  return (
    <div className={styles[size]}>
      <img src={src} alt={alt} className={styles.shirt} draggable={false} onError={handleError} />
    </div>
  );
};

Jersey.displayName = 'Jersey';
