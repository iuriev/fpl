import React, { useState } from 'react';

import { useFixturesCalendar } from '@/api/queries';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy } from '@/lib/copy';

import { CalendarGrid } from './CalendarGrid';
import type { CalendarMode } from './FixtureCell';
import { FixturesCalendarHelpSheet } from './FixturesCalendarHelpSheet';
import styles from './FixturesCalendarScreen.module.css';

const TABS: { mode: CalendarMode; label: string }[] = [
  { mode: 'official', label: copy.fixturesCalendarTabOfficial },
  { mode: 'overall', label: copy.fixturesCalendarTabOverall },
  { mode: 'defensive', label: copy.fixturesCalendarTabDefensive },
  { mode: 'attacking', label: copy.fixturesCalendarTabAttacking },
  { mode: 'restDays', label: copy.fixturesCalendarTabRestDays },
];

export const FixturesCalendarScreen: React.FC = () => {
  const [mode, setMode] = useState<CalendarMode>('official');
  const [helpOpen, setHelpOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useFixturesCalendar();

  return (
    <div className={styles.screen}>
      <ScreenHeader
        title={copy.fixturesCalendarTitle}
        right={
          <button
            type="button"
            className={styles.helpBtn}
            onClick={() => setHelpOpen(true)}
            aria-label={copy.fixturesCalendarHelpButton}
          >
            <svg
              width="1.25rem"
              height="1.25rem"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
        }
      />

      {helpOpen ? (
        <FixturesCalendarHelpSheet open onClose={() => setHelpOpen(false)} />
      ) : null}

      <div className={styles.tabs} role="tablist" aria-label={copy.fixturesCalendarTitle}>
        {TABS.map((tab) => (
          <button
            key={tab.mode}
            role="tab"
            aria-selected={mode === tab.mode}
            className={`${styles.tab} ${mode === tab.mode ? styles.tabActive : ''}`}
            onClick={() => setMode(tab.mode)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {isLoading && <p className={styles.message}>Loading…</p>}

        {isError && (
          <div className={styles.message}>
            <p>Unable to load fixtures. Please try again.</p>
            <button type="button" className={styles.retry} onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {data && <CalendarGrid data={data} mode={mode} />}
      </div>
    </div>
  );
};

FixturesCalendarScreen.displayName = 'FixturesCalendarScreen';
