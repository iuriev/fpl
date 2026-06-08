import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useGameweeks, usePlayerPool } from '@/api/queries';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy, interpolate } from '@/lib/copy';
import { usePlayerWatchlistRepository } from '@/lib/player-watchlist-repository';

import { AddPlayerSheet } from './AddPlayerSheet';
import styles from './PlayerWatchlistScreen.module.css';
import { WatchedPlayerRow } from './WatchedPlayerRow';

export const PlayerWatchlistScreen: React.FC = () => {
  const repo = usePlayerWatchlistRepository();

  const [watchedCodes, setWatchedCodes] = useState<number[]>([]);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: gameweeksData } = useGameweeks();
  const { data: poolData } = usePlayerPool();
  const finishedGws = gameweeksData?.gameweeks.filter((gw) => gw.finished) ?? [];
  const currentGw = finishedGws.length > 0 ? finishedGws[finishedGws.length - 1].id : (gameweeksData?.current ?? null);

  const nameByCode = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of poolData?.players ?? []) map.set(p.code, p.webName);
    return map;
  }, [poolData?.players]);

  useEffect(() => {
    repo.list().then(setWatchedCodes);
  }, [repo]);

  const refreshList = () => {
    repo.list().then(setWatchedCodes);
  };

  const handleRemove = async (fplCode: number) => {
    await repo.remove(fplCode);
    refreshList();
  };

  const filteredCodes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return watchedCodes;
    return watchedCodes.filter((code) => nameByCode.get(code)?.toLowerCase().includes(q));
  }, [watchedCodes, search, nameByCode]);

  const limit = repo.getLimit();
  const atLimit = watchedCodes.length >= limit;

  const capacityBadge = interpolate(copy.playerWatchlistCapacityBadge, {
    count: watchedCodes.length,
    limit,
  });

  return (
    <div className={styles.screen}>
      <ScreenHeader
        title={copy.playerWatchlistTitle}
        right={
          <span className={`${styles.capacityBadge} ${atLimit ? styles.capacityBadgeAtLimit : ''}`}>
            {capacityBadge}
          </span>
        }
      />

      <div className={styles.searchWrap}>
        <input
          className={styles.search}
          type="search"
          placeholder={copy.playerWatchlistSearch}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={copy.playerWatchlistSearch}
        />
      </div>

      {watchedCodes.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>{copy.playerWatchlistEmpty}</p>
          <p className={styles.emptySubtext}>{copy.playerWatchlistEmptySubtext}</p>
          <Link to="/top-players" className={styles.browseLink}>
            {copy.playerWatchlistBrowse} →
          </Link>
        </div>
      ) : (
        <div className={styles.list}>
          {filteredCodes.map((code, i) => (
            <WatchedPlayerRow
              key={code}
              rank={i + 1}
              fplCode={code}
              currentGw={currentGw}
              onRemove={() => handleRemove(code)}
            />
          ))}
        </div>
      )}

      <div className={styles.addWrap}>
        <button className={styles.addBtn} onClick={() => setAddSheetOpen(true)}>
          {copy.playerWatchlistAddByName}
        </button>
      </div>

      <AddPlayerSheet
        open={addSheetOpen}
        onClose={() => {
          setAddSheetOpen(false);
          refreshList();
        }}
        currentGw={currentGw}
      />
    </div>
  );
};

PlayerWatchlistScreen.displayName = 'PlayerWatchlistScreen';
