import React from 'react';

import type { CalendarFixture } from '@/types';

import styles from './FixtureCell.module.css';

export type CalendarMode = 'official' | 'overall' | 'defensive' | 'attacking' | 'restDays';

interface FixtureCellProps {
  fixtures: CalendarFixture[];
  mode: CalendarMode;
  isDgwCol: boolean;
}

function getDifficulty(fixture: CalendarFixture, mode: CalendarMode): 1 | 2 | 3 | 4 | 5 {
  switch (mode) {
    case 'overall':
      return fixture.overallDifficulty;
    case 'defensive':
      return fixture.defensiveDifficulty;
    case 'attacking':
      return fixture.attackingDifficulty;
    default:
      return fixture.officialDifficulty;
  }
}

function getRestClass(days: number | null): string {
  if (days === null) return styles.restTbc;
  if (days <= 3) return styles.restTight;
  if (days <= 6) return styles.restModerate;
  return styles.restEasy;
}

function RestChip({ fixture }: { fixture: CalendarFixture }) {
  const cls = getRestClass(fixture.restDaysBefore);
  const label = fixture.restDaysBefore === null ? 'TBC' : `${fixture.restDaysBefore}d`;
  return (
    <span
      className={`${styles.chip} ${cls}`}
      title={`${fixture.opponentShortName} (${fixture.home ? 'H' : 'A'})`}
    >
      <span className={styles.chipName}>{fixture.opponentShortName}</span>
      <span className={styles.chipSub}>{label}</span>
    </span>
  );
}

function FdrChip({ fixture, mode }: { fixture: CalendarFixture; mode: CalendarMode }) {
  const d = getDifficulty(fixture, mode);
  return (
    <span
      className={`${styles.chip} ${styles[`fdr${d}`]}`}
      title={`${fixture.opponentShortName} (${fixture.home ? 'H' : 'A'})`}
    >
      <span className={styles.chipName}>{fixture.opponentShortName}</span>
      <span className={styles.chipSub}>{fixture.home ? 'H' : 'A'}</span>
    </span>
  );
}

export const FixtureCell: React.FC<FixtureCellProps> = ({ fixtures, mode, isDgwCol }) => {
  if (fixtures.length === 0) {
    return (
      <div className={`${styles.cell} ${isDgwCol ? styles.cellDgwEmpty : ''} ${styles.bgw}`}>
        <span>—</span>
      </div>
    );
  }

  return (
    <div className={`${styles.cell} ${fixtures.length >= 2 ? styles.cellRow : ''}`}>
      {fixtures.map((fixture, i) => (
        <React.Fragment key={`${fixture.opponentId}-${i}`}>
          {i > 0 && <div className={styles.separator} />}
          {mode === 'restDays' ? (
            <RestChip fixture={fixture} />
          ) : (
            <FdrChip fixture={fixture} mode={mode} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

FixtureCell.displayName = 'FixtureCell';
