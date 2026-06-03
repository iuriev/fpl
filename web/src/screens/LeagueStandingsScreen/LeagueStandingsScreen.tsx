import { useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useLeagueStandings } from '@/api/queries';
import { Button } from '@/components/ui/Button/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy } from '@/lib/copy';

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

  const leagueIdNum = leagueId ? Number(leagueId) : null;

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useLeagueStandings(leagueIdNum);

  const allStandings = useMemo(
    () => data?.pages.flatMap((p) => p.standings) ?? [],
    [data],
  );

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const handleRowClick = useCallback(
    (entry: number) => {
      const returnTo = `/leagues/${leagueId}/standings${searchParams.toString() ? `?${searchParams}` : ''}`;
      navigate(`/?teamId=${entry}`, { state: { returnTo } });
    },
    [navigate, leagueId, searchParams],
  );

  const leagueName = data?.pages[0]?.leagueName ?? copy.leagueStandingsBack;

  const gwParam = searchParams.get('gw');
  const statsPath = `/stats${gwParam ? `?gw=${gwParam}` : ''}`;

  return (
    <div className={styles.screen}>
      <ScreenHeader
        title={leagueName}
        backTo={statsPath}
        backLabel={copy.leagueStandingsBack}
      />

      <div className={styles.body}>
        {isLoading && <LeagueStandingsSkeleton />}

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

        {hasNextPage && (
          <div className={styles.loadMoreWrap}>
            <Button variant="secondary" onClick={handleLoadMore} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? copy.leagueStandingsLoading : copy.leagueStandingsLoadMore}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

LeagueStandingsScreen.displayName = 'LeagueStandingsScreen';
