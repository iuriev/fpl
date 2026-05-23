import React from 'react';

import type { PlayerPosition } from '@/types';

import styles from './PositionBadge.module.css';

export interface PositionBadgeProps {
  position: PlayerPosition;
}

export const PositionBadge: React.FC<PositionBadgeProps> = ({ position }) => {
  return (
    <span className={`${styles.badge} ${styles[`badge_${position}`]}`}>
      {position}
    </span>
  );
};

PositionBadge.displayName = 'PositionBadge';
