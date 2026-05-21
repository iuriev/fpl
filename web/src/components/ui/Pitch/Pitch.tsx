/**
 * Pitch component — SVG football pitch with stripes.
 * Placeholder; will be enhanced with player tokens later.
 */

import React from 'react';

import styles from './Pitch.module.css';

export interface PitchProps {
  children?: React.ReactNode;
}

export const Pitch: React.FC<PitchProps> = ({ children }) => {
  return (
    <div className={styles.container}>
      <svg viewBox="0 0 100 156" preserveAspectRatio="xMidYMid meet" className={styles.svg}>
        {/* Pitch stripes (alternating greens) */}
        <defs>
          <pattern id="stripes" x="0" y="0" width="4" height="156" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="2" height="156" fill="var(--fpl-pitch-a)" />
            <rect x="2" y="0" width="2" height="156" fill="var(--fpl-pitch-b)" />
          </pattern>
        </defs>

        {/* Background */}
        <rect width="100" height="156" fill="url(#stripes)" />

        {/* White pitch lines */}
        <line x1="50" y1="0" x2="50" y2="156" stroke="var(--fpl-pitch-line)" strokeWidth="0.6" />
        <circle cx="50" cy="78" r="9.15" stroke="var(--fpl-pitch-line)" strokeWidth="0.6" fill="none" />
        <circle cx="50" cy="78" r="0.5" stroke="var(--fpl-pitch-line)" strokeWidth="0.3" fill="var(--fpl-pitch-line)" />

        {/* Penalty areas */}
        <rect x="16.5" y="0" width="67" height="16.5" stroke="var(--fpl-pitch-line)" strokeWidth="0.5" fill="none" />
        <rect x="16.5" y="139.5" width="67" height="16.5" stroke="var(--fpl-pitch-line)" strokeWidth="0.5" fill="none" />
      </svg>
      {children}
    </div>
  );
};

Pitch.displayName = 'Pitch';
