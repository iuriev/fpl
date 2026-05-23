import React from 'react';

import type { PlayerStatus } from '@/types';

import styles from './StatusDot.module.css';

export interface StatusDotProps {
  status: PlayerStatus;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status }) => {
  if (status === 'a') return null;
  const variant = status === 'd' ? 'warn' : 'error';
  return <span className={`${styles.dot} ${styles[`dot_${variant}`]}`} />;
};

StatusDot.displayName = 'StatusDot';
