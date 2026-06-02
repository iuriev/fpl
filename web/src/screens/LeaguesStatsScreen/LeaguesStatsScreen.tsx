import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useLeagues } from '@/api/queries';
import { Button } from '@/components/ui/Button/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy } from '@/lib/copy';
import type { LeagueEntry } from '@/types';

import { formatRank, getLeagueRankDirection, type RankDirection } from './leagues-helpers';
import styles from './LeaguesStatsScreen.module.css';

export interface LeaguesStatsScreenProps {
  teamId: number;
}

const DIR_SYMBOL: Record<RankDirection, string> = {
  up: '↑',
  down: '↓',
  neutral: '—',
};

const DIR_CLASS: Record<RankDirection, string> = {
  up: styles.dirUp,
  down: styles.dirDown,
  neutral: styles.dirNeutral,
};

function LeagueRow({ league }: { league: LeagueEntry }) {
  const dir = getLeagueRankDirection(league.rank, league.lastRank);
  return (
    <div className={styles.row}>
      <span className={styles.leagueName}>{league.name}</span>
      <span className={styles.rank}>{formatRank(league.rank)}</span>
      <span className={`${styles.dir} ${DIR_CLASS[dir]}`} aria-label={dir}>
        {DIR_SYMBOL[dir]}
      </span>
    </div>
  );
}

function LeagueSection({ title, leagues }: { title: string; leagues: LeagueEntry[] }) {
  return (
    <section className={styles.section}>
      <span className={styles.sectionLabel}>{title}</span>
      <div className={styles.leagueList}>
        {leagues.map((league) => (
          <LeagueRow key={league.id} league={league} />
        ))}
      </div>
    </section>
  );
}

const SKELETON_ROWS = 5;

function LeaguesSkeleton() {
  return (
    <div aria-label={copy.loadingPlaceholder} aria-busy="true">
      <div className={styles.skeletonSection}>
        <div className={`${styles.skeletonCell} ${styles.skeletonLabel}`} />
        {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
          <div key={i} className={styles.skeletonRow}>
            <div className={`${styles.skeletonCell} ${styles.skeletonName}`} />
            <div className={`${styles.skeletonCell} ${styles.skeletonRank}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export const LeaguesStatsScreen: React.FC<LeaguesStatsScreenProps> = ({ teamId }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { data, isLoading, isError, refetch } = useLeagues(teamId);

  const handleBack = () => {
    const gwParam = searchParams.get('gw');
    navigate(`/?teamId=${teamId}${gwParam ? `&gw=${gwParam}` : ''}`);
  };

  return (
    <div className={styles.screen}>
      <ScreenHeader backLabel={copy.statsBack} onBack={handleBack} title={copy.statsTitle} />

      <div className={styles.body}>
        {isLoading && <LeaguesSkeleton />}

        {isError && (
          <div className={styles.stateCenter}>
            <p className={styles.stateText}>{copy.statsLoadError}</p>
            <Button variant="secondary" onClick={() => refetch()}>
              {copy.statsRetry}
            </Button>
          </div>
        )}

        {data && data.classic.length === 0 && data.h2h.length === 0 && (
          <div className={styles.stateCenter}>
            <p className={styles.stateText}>{copy.statsNoLeagues}</p>
          </div>
        )}

        {data && data.classic.length > 0 && (
          <LeagueSection title={copy.statsGeneralLeagues} leagues={data.classic} />
        )}

        {data && data.h2h.length > 0 && (
          <LeagueSection title={copy.statsH2HLeagues} leagues={data.h2h} />
        )}
      </div>
    </div>
  );
};

LeaguesStatsScreen.displayName = 'LeaguesStatsScreen';
