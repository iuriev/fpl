import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useGameweeks } from '@/api/queries';
import { PremiumSheet } from '@/components/ui/PremiumSheet/PremiumSheet';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy, interpolate } from '@/lib/copy';
import { useMyTeam } from '@/lib/my-team/MyTeamContext';
import { useWatchlistRepository,type WatchedManager } from '@/lib/watchlist-repository';

import { AddManagerInput } from './AddManagerInput';
import { FromLeaguesSection } from './FromLeaguesSection';
import { ManagerRow } from './ManagerRow';
import styles from './WatchlistScreen.module.css';

export const WatchlistScreen: React.FC = () => {
  const navigate = useNavigate();
  const { myTeamId } = useMyTeam();
  const repo = useWatchlistRepository();
  const { data: gameweeksData } = useGameweeks();

  const [watchedManagers, setWatchedManagers] = useState<WatchedManager[]>([]);
  const [premiumOpen, setPremiumOpen] = useState(false);

  const refreshList = useCallback(async () => {
    const managers = await repo.list();
    setWatchedManagers(managers);
  }, [repo]);

  useEffect(() => {
    repo.list().then(setWatchedManagers);
  }, [repo]);

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
    navigate('/');
  };

  const currentGw = gameweeksData?.current ?? null;
  const limit = repo.getLimit();
  const isFull = watchedManagers.length >= limit;
  const watchedSet = new Set(watchedManagers.map((m) => m.teamId));

  return (
    <div className={styles.screen}>
      <ScreenHeader
        backLabel={copy.watchlistBack}
        onBack={handleBack}
        title={copy.watchlistTitle}
        right={
          <span className={styles.capacity}>
            {interpolate(copy.watchlistCapacity, { n: watchedManagers.length, max: limit })}
          </span>
        }
      />

      <div className={styles.body}>
        <AddManagerInput onAdded={refreshList} onLimitReached={() => setPremiumOpen(true)} />

        {watchedManagers.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyHeading}>{copy.watchlistEmptyHeading}</p>
            <p className={styles.emptySubtext}>{copy.watchlistEmptySubtext}</p>
          </div>
        ) : (
          <div className={styles.cardList}>
            {currentGw !== null && watchedManagers.map((manager) => (
              <ManagerRow
                key={manager.teamId}
                teamId={manager.teamId}
                entryData={manager}
                currentGw={currentGw}
                onRemove={() => handleRemove(manager.teamId)}
                isOwnTeam={myTeamId !== null && manager.teamId === myTeamId}
              />
            ))}
          </div>
        )}

        <FromLeaguesSection
          userTeamId={myTeamId}
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
