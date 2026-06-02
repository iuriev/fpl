import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useGameweeks } from '@/api/queries';
import { PremiumSheet } from '@/components/ui/PremiumSheet/PremiumSheet';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
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
  const [premiumOpen, setPremiumOpen] = useState(false);

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
    else if (result === 'limit') setPremiumOpen(true);
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
      <ScreenHeader
        backLabel={copy.watchlistBack}
        onBack={handleBack}
        title={copy.watchlistTitle}
        right={
          <span className={styles.capacity}>
            {interpolate(copy.watchlistCapacity, { n: watchedIds.length, max: limit })}
          </span>
        }
      />

      <div className={styles.body}>
        <AddManagerInput onAdded={refreshList} onLimitReached={() => setPremiumOpen(true)} />

        {watchedIds.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyHeading}>{copy.watchlistEmptyHeading}</p>
            <p className={styles.emptySubtext}>{copy.watchlistEmptySubtext}</p>
          </div>
        ) : (
          <div className={styles.cardList}>
            {currentGw !== null && watchedIds.map((teamId) => (
              <ManagerRow
                key={teamId}
                teamId={teamId}
                currentGw={currentGw}
                onRemove={() => handleRemove(teamId)}
                isOwnTeam={userTeamId !== undefined && teamId === userTeamId}
              />
            ))}
          </div>
        )}

        <FromLeaguesSection
          userTeamId={userTeamId ?? null}
          watchedIds={watchedSet}
          isFull={isFull}
          onFollow={handleFollow}
          onLimitReached={() => setPremiumOpen(true)}
        />
      </div>

      <PremiumSheet
        open={premiumOpen}
        onClose={() => setPremiumOpen(false)}
        title={copy.premiumWatchlistTitle}
        description={copy.premiumWatchlistDescription}
        freeLabel={copy.premiumWatchlistFreeLabel}
        premiumLabel={copy.premiumWatchlistPremiumLabel}
      />
    </div>
  );
};

WatchlistScreen.displayName = 'WatchlistScreen';
