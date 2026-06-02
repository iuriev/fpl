import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useLeagueStandings } from '@/api/queries';
import { Button } from '@/components/ui/Button/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy } from '@/lib/copy';
import type { StandingEntry } from '@/types';

import styles from './LeagueStandingsScreen.module.css';
import { StandingRow } from './StandingRow';

const SKELETON_ROWS = 8;

function LeagueStandingsSkeleton() {
  return (
    <div aria-label={copy.loadingPlaceholder} aria-busy="true" className={styles.skeletonList}>
      {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <div className={`${styles.skeletonCell} ${styles.skeletonRank}`} />
          <div className={styles.skeletonNameBlock}>
            <div className={`${styles.skeletonCell} ${styles.skeletonName}`} />
            <div className={`${styles.skeletonCell} ${styles.skeletonEntry}`} />
          </div>
          <div className={`${styles.skeletonCell} ${styles.skeletonNum}`} />
          <div className={`${styles.skeletonCell} ${styles.skeletonNum}`} />
        </div>
      ))}
    </div>
  );
}

export function LeagueStandingsScreen() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const gwParam = searchParams.get('gw');
  const backParam = searchParams.get('back') ?? '/stats';
  const leagueIdNum = leagueId ? Number(leagueId) : null;

  const [allStandings, setAllStandings] = useState<StandingEntry[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const { data, isLoading, isError, refetch } = useLeagueStandings(leagueIdNum, page);

  useEffect(() => {
    if (!data) return;
    if (page === 1) {
      setAllStandings(data.standings);
    } else {
      setAllStandings((prev) => [...prev, ...data.standings]);
      setLoadingMore(false);
    }
  }, [data, page]);

  const handleLoadMore = useCallback(() => {
    setLoadingMore(true);
    setPage((p) => p + 1);
  }, []);

  const handleBack = useCallback(() => {
    navigate(backParam);
  }, [navigate, backParam]);

  const handleRowClick = useCallback(
    (entry: number) => {
      navigate(`/?teamId=${entry}${gwParam ? `&gw=${gwParam}` : ''}`);
    },
    [navigate, gwParam],
  );

  const leagueName = data?.leagueName ?? copy.leagueStandingsBack;
  const hasNext = data?.hasNext ?? false;

  return (
    <div className={styles.screen}>
      <ScreenHeader backLabel={copy.leagueStandingsBack} onBack={handleBack} title={leagueName} />

      <div className={styles.body}>
        {isLoading && page === 1 && <LeagueStandingsSkeleton />}

        {isError && (
          <div className={styles.stateCenter}>
            <p className={styles.stateText}>{copy.leagueStandingsLoadError}</p>
            <Button variant="secondary" onClick={() => refetch()}>
              {copy.leagueStandingsRetry}
            </Button>
          </div>
        )}

        {!isLoading && !isError && allStandings.length === 0 && (
          <div className={styles.stateCenter}>
            <p className={styles.stateText}>{copy.leagueStandingsEmpty}</p>
          </div>
        )}

        {allStandings.length > 0 && (
          <div className={styles.standingsList}>
            {allStandings.map((s) => (
              <StandingRow key={s.entry} standing={s} onClick={() => handleRowClick(s.entry)} />
            ))}
          </div>
        )}

        {hasNext && (
          <div className={styles.loadMoreWrap}>
            <Button variant="secondary" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? copy.leagueStandingsLoading : copy.leagueStandingsLoadMore}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

LeagueStandingsScreen.displayName = 'LeagueStandingsScreen';
