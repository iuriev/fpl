import React from 'react';

import { copy } from '@/lib/copy';

import styles from './TotwBadge.module.css';

export const TotwBadge: React.FC = () => (
  <span className={styles.badge} aria-label={copy.teamOfTheWeekPlayerBadge}>
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M6 1.5L7.35 4.65L10.8 5.05L8.2 7.35L8.95 10.75L6 9.15L3.05 10.75L3.8 7.35L1.2 5.05L4.65 4.65L6 1.5Z"
        fill="currentColor"
      />
    </svg>
  </span>
);

TotwBadge.displayName = 'TotwBadge';
