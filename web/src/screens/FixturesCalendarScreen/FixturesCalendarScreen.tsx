import React, { useState } from 'react';

import { useFixturesCalendar } from '@/api/queries';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy } from '@/lib/copy';

import { CalendarGrid } from './CalendarGrid';
import type { CalendarMode } from './FixtureCell';
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
  const { data, isLoading, isError, refetch } = useFixturesCalendar();

  return (
    <div className={styles.screen}>
      <ScreenHeader title={copy.fixturesCalendarTitle} />

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
