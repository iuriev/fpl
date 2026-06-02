import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useGameweeks } from '@/api/queries';
import { copy, interpolate } from '@/lib/copy';
import { useWatchlistRepository } from '@/lib/watchlist-repository';

import { AddManagerInput } from './AddManagerInput';
import { FromLeaguesSection } from './FromLeaguesSection';
import { ManagerRow } from './ManagerRow';
import styles from './WatchlistScreen.module.css';

export interface WatchlistScreenProps {
  userTeamId?: number;
}

export const WatchlistScreen: React.FC<WatchlistScreenProps> = ({ userTeamId }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const repo = useWatchlistRepository();
  const { data: gameweeksData } = useGameweeks();

  const [watchedIds, setWatchedIds] = useState<number[]>([]);

  const refreshList = useCallback(async () => {
    const ids = await repo.list();
    setWatchedIds(ids);
  }, [repo]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const handleRemove = useCallback(async (teamId: number) => {
    await repo.remove(teamId);
    refreshList();
  }, [repo, refreshList]);

  const handleFollow = useCallback(async (teamId: number) => {
    const result = await repo.add(teamId);
    if (result === 'ok') refreshList();
  }, [repo, refreshList]);

  const handleBack = () => {
    const gwParam = searchParams.get('gw');
    const teamIdParam = userTeamId ?? searchParams.get('teamId');
    navigate(teamIdParam ? `/?teamId=${teamIdParam}${gwParam ? `&gw=${gwParam}` : ''}` : '/');
  };

  const currentGw = gameweeksData?.current ?? null;
  const limit = repo.getLimit();
  const isFull = watchedIds.length >= limit;
  const watchedSet = new Set(watchedIds);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack} aria-label={copy.watchlistBack}>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M10 4l-4 4 4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {copy.watchlistBack}
        </button>
        <div className={styles.heading}>
          <span className={styles.title}>{copy.watchlistTitle}</span>
        </div>
        <span className={styles.capacity}>
          {interpolate(copy.watchlistCapacity, { n: watchedIds.length, max: limit })}
        </span>
      </header>

      <div className={styles.body}>
        <AddManagerInput onAdded={refreshList} />

        {watchedIds.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyHeading}>{copy.watchlistEmptyHeading}</p>
            <p className={styles.emptySubtext}>{copy.watchlistEmptySubtext}</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={`${styles.th} ${styles.cellSticky}`}>{copy.watchlistColManager}</th>
                  <th className={styles.th}>{copy.watchlistColGwPts}</th>
                  <th className={styles.th}>{copy.watchlistColGwRank}</th>
                  <th className={styles.th}>{copy.watchlistColOverallRank}</th>
                  <th className={styles.th}>{copy.watchlistColRankDelta}</th>
                  <th className={styles.th}>{copy.watchlistColTransfers}</th>
                  <th className={styles.th}>{copy.watchlistColCaptain}</th>
                  <th className={styles.th}>{copy.watchlistColLatestIn}</th>
                  <th className={styles.th} aria-label="Remove" />
                </tr>
              </thead>
              <tbody>
                {currentGw !== null && watchedIds.map((teamId) => (
                  <ManagerRow
                    key={teamId}
                    teamId={teamId}
                    currentGw={currentGw}
                    onRemove={() => handleRemove(teamId)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <FromLeaguesSection
          userTeamId={userTeamId ?? null}
          watchedIds={watchedSet}
          isFull={isFull}
          onFollow={handleFollow}
        />
      </div>
    </div>
  );
};

WatchlistScreen.displayName = 'WatchlistScreen';
