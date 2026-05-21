/**
 * Jersey component — placeholder shirt.
 * MVP: single placeholder for all players.
 * Later: swap to real per-club kit images from CDN.
 */

import React from 'react';

import styles from './Jersey.module.css';

export interface JerseyProps {
  size?: 'large' | 'medium';
  teamCode?: string;
  alt?: string;
}

export const Jersey: React.FC<JerseyProps> = ({ size = 'large', alt = 'Player jersey' }) => {
  return (
    <div className={styles[size]}>
      <img
        src="/shirts/placeholder.webp"
        alt={alt}
        className={styles.shirt}
        draggable={false}
      />
    </div>
  );
};

Jersey.displayName = 'Jersey';
