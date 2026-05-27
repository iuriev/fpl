import React from 'react';

import styles from './Pitch.module.css';

export interface PitchProps {
  children?: React.ReactNode;
  className?: string;
}

const STRIPE_COUNT = 8;
const STRIPE_H = 156 / STRIPE_COUNT;

export const Pitch: React.FC<PitchProps> = ({ children, className }) => {
  return (
    <div className={`${styles.container}${className ? ` ${className}` : ''}`}>
      <svg viewBox="0 0 100 156" preserveAspectRatio="xMidYMid meet" className={styles.svg}>
        {Array.from({ length: STRIPE_COUNT }, (_, i) => (
          <rect
            key={i}
            x="0"
            y={i * STRIPE_H}
            width="100"
            height={STRIPE_H}
            fill={i % 2 === 0 ? 'var(--fpl-pitch-a)' : 'var(--fpl-pitch-b)'}
          />
        ))}

        <rect x="0" y="1" width="100" height="154" fill="none" stroke="var(--fpl-pitch-line)" strokeWidth="0.6" />

        <line x1="1" y1="78" x2="99" y2="78" stroke="var(--fpl-pitch-line)" strokeWidth="0.6" />
        <circle cx="50" cy="78" r="9.15" stroke="var(--fpl-pitch-line)" strokeWidth="0.5" fill="none" />
        <circle cx="50" cy="78" r="0.5" fill="var(--fpl-pitch-line)" />

        <rect x="25" y="1" width="50" height="18" fill="none" stroke="var(--fpl-pitch-line)" strokeWidth="0.5" />
        <rect x="38" y="1" width="24" height="7" fill="none" stroke="var(--fpl-pitch-line)" strokeWidth="0.5" />
        <path d="M 42 19 A 8 8 0 0 0 58 19" fill="none" stroke="var(--fpl-pitch-line)" strokeWidth="0.5" />

        <rect x="25" y="137" width="50" height="18" fill="none" stroke="var(--fpl-pitch-line)" strokeWidth="0.5" />
        <rect x="38" y="148" width="24" height="7" fill="none" stroke="var(--fpl-pitch-line)" strokeWidth="0.5" />
        <path d="M 42 137 A 8 8 0 0 1 58 137" fill="none" stroke="var(--fpl-pitch-line)" strokeWidth="0.5" />

        <rect x="43.5" y="0" width="13" height="1.5" fill="var(--fpl-pitch-line)" />
        <rect x="43.5" y="154.5" width="13" height="1.5" fill="var(--fpl-pitch-line)" />
      </svg>
      {children}
    </div>
  );
};

Pitch.displayName = 'Pitch';
