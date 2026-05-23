import React from 'react';

import styles from './CapInlineBadge.module.css';

export interface CapInlineBadgeProps {
  cap: 'C' | 'V' | null | undefined;
}

export const CapInlineBadge: React.FC<CapInlineBadgeProps> = ({ cap }) => {
  if (!cap) return null;
  return (
    <span className={`${styles.badge} ${cap === 'C' ? styles.badge_captain : styles.badge_vice}`}>
      {cap}
    </span>
  );
};

CapInlineBadge.displayName = 'CapInlineBadge';
