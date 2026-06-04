import React from 'react';
import { useSearchParams } from 'react-router-dom';

import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy } from '@/lib/copy';
import { GameweekHistoryPanel } from '@/screens/GameweekHistoryScreen/GameweekHistoryPanel';
import { LeaguesStatsPanel } from '@/screens/LeaguesStatsScreen/LeaguesStatsPanel';

import styles from './MyStatsScreen.module.css';

export type MyStatsTab = 'leagues' | 'history';

export interface MyStatsScreenProps {
  teamId: number;
}

export const MyStatsScreen: React.FC<MyStatsScreenProps> = ({ teamId }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeTab: MyStatsTab = tabParam === 'history' ? 'history' : 'leagues';

  const setTab = (tab: MyStatsTab) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (tab === 'history') {
        p.set('tab', 'history');
      } else {
        p.delete('tab');
      }
      return p;
    });
  };

  return (
    <div className={styles.screen}>
      <ScreenHeader title={copy.statsTitle} teamId={teamId} />

      <div className={styles.tabs} role="tablist" aria-label={copy.statsTitle}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'leagues'}
          className={`${styles.tab} ${activeTab === 'leagues' ? styles.tabActive : ''}`}
          onClick={() => setTab('leagues')}
        >
          {copy.statsTabLeagues}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}
          onClick={() => setTab('history')}
        >
          {copy.statsTabHistory}
        </button>
      </div>

      <div className={styles.panel} role="tabpanel">
        <LeaguesStatsPanel teamId={teamId} active={activeTab === 'leagues'} />
        <GameweekHistoryPanel teamId={teamId} active={activeTab === 'history'} />
      </div>
    </div>
  );
};

MyStatsScreen.displayName = 'MyStatsScreen';
