import React from 'react';

import styles from './ScreenHeader.module.css';

export interface ScreenHeaderProps {
  backLabel: string;
  onBack: () => void;
  title: string;
  right?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ backLabel, onBack, title, right }) => (
  <header className={styles.header}>
    <button className={styles.backBtn} onClick={onBack} aria-label={backLabel}>
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M10 4l-4 4 4 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {backLabel}
    </button>

    <div className={styles.heading}>
      <span className={styles.title}>{title}</span>
    </div>

    <div className={styles.right}>{right}</div>
  </header>
);

ScreenHeader.displayName = 'ScreenHeader';
