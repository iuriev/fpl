import React from 'react';

import { copy } from '@/lib/copy';
import type { ActiveChip } from '@/types';

import styles from './ChipBadge.module.css';

// Shared octagonal badge path — same shape for every chip (matches FPL official design)
const BADGE = 'M6 2h12l4 4v12l-4 4H6l-4-4V6Z';

function WildcardSvg() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={BADGE} className={styles.badgeFill} />
      <path d={BADGE} className={styles.badgeStroke} />
      {/* 5-pointed star: outer r=6, inner r=2.5, centre (12, 12.5) */}
      <path
        d="M12 6.5L13.5 10.5L17.7 10.6L14.7 13L15.8 17.3L12 15L8.2 17.3L9.3 13L5.3 10.6L9.5 10.5Z"
        className={styles.icon}
      />
    </svg>
  );
}

function TripleCaptainSvg() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={BADGE} className={styles.badgeFill} />
      <path d={BADGE} className={styles.badgeStroke} />
      {/* Coin/drum: top disc */}
      <ellipse cx="12" cy="9.8" rx="5" ry="1.8" className={styles.icon} />
      {/* Coin body */}
      <rect x="7" y="9.8" width="10" height="4.2" className={styles.iconMid} />
      {/* Bottom rim */}
      <ellipse cx="12" cy="14" rx="5" ry="1.8" className={styles.icon} />
      {/* "C" gap on right face — cut using parent background colour */}
      <rect x="16" y="10.6" width="1.5" height="2.6" className={styles.badgePunch} />
    </svg>
  );
}

function FreeHitSvg() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={BADGE} className={styles.badgeFill} />
      <path d={BADGE} className={styles.badgeStroke} />
      {/* Ticket: pentagon (arrow-right) with punched hole, evenodd rule removes circle */}
      <path
        d="M7.5 9.5h7.5l3 2.5-3 2.5H7.5V9.5Z M8.6 10.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z"
        fillRule="evenodd"
        className={styles.icon}
      />
      {/* FREE: three horizontal lines inside ticket body */}
      <path d="M10.5 11h4M10.5 12h3.2M10.5 13h4" className={styles.iconLines} />
    </svg>
  );
}

function BenchBoostSvg() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={BADGE} className={styles.badgeFill} />
      <path d={BADGE} className={styles.badgeStroke} />
      {/* Upward arrow */}
      <path d="M12 7L7 12h3.5v4h3v-4H17Z" className={styles.icon} />
      {/* Bench seat bar */}
      <rect x="7.5" y="17.5" width="9" height="2" rx="1" className={styles.icon} />
    </svg>
  );
}

const SVG_MAP: Record<NonNullable<ActiveChip>, () => React.ReactElement> = {
  wildcard: WildcardSvg,
  '3xc':    TripleCaptainSvg,
  freehit:  FreeHitSvg,
  bboost:   BenchBoostSvg,
};

export const CHIP_LABELS: Record<NonNullable<ActiveChip>, string> = {
  wildcard: copy.chipWildcard,
  '3xc':    copy.chipTripleCaptain,
  freehit:  copy.chipFreeHit,
  bboost:   copy.chipBenchBoost,
};

/** Renders just the octagonal chip icon SVG — for embedding in compact contexts. */
export function ChipIconSvg({ chip }: { chip: NonNullable<ActiveChip> }) {
  const Icon = SVG_MAP[chip];
  return <Icon />;
}

export interface ChipBadgeProps {
  chip: ActiveChip;
}

/** Standalone full-width banner — shown above SummaryStrip in some contexts. */
export const ChipBadge: React.FC<ChipBadgeProps> = ({ chip }) => {
  if (!chip) return null;
  const Icon = SVG_MAP[chip];
  return (
    <div
      className={styles.badge}
      role="status"
      aria-label={`${CHIP_LABELS[chip]} ${copy.chipActiveSuffix}`}
    >
      <span className={styles.iconWrap}>
        <Icon />
      </span>
      <span className={styles.label}>
        {CHIP_LABELS[chip]}
        <span className={styles.suffix}> · {copy.chipActiveSuffix}</span>
      </span>
    </div>
  );
};

ChipBadge.displayName = 'ChipBadge';
