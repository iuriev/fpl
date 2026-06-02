import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useGameweeks } from '@/api/queries';
import { useTopPlayersGw, useTopPlayersSeason } from '@/api/queries';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy, interpolate } from '@/lib/copy';
import { usePlayerWatchlistRepository } from '@/lib/player-watchlist-repository';

import { AddPlayerSheet } from './AddPlayerSheet';
import styles from './PlayerWatchlistScreen.module.css';
import { WatchedPlayerRow } from './WatchedPlayerRow';

export const PlayerWatchlistScreen: React.FC = () => {
  const navigate = useNavigate();
  const repo = usePlayerWatchlistRepository();

  const [watchedIds, setWatchedIds] = useState<number[]>([]);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: gameweeksData } = useGameweeks();
  const currentGw = gameweeksData?.gameweeks.find((gw) => gw.finished)?.id ?? gameweeksData?.current ?? null;

  const gwQuery = useTopPlayersGw(currentGw);
  const seasonQuery = useTopPlayersSeason();

  const gwMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of gwQuery.data?.players ?? []) map.set(p.id, p.webName);
    for (const p of seasonQuery.data?.players ?? []) if (!map.has(p.id)) map.set(p.id, p.webName);
    return map;
  }, [gwQuery.data, seasonQuery.data]);

  useEffect(() => {
    repo.list().then(setWatchedIds);
  }, [repo]);

  const refreshList = () => {
    repo.list().then(setWatchedIds);
  };

  const handleRemove = async (playerId: number) => {
    await repo.remove(playerId);
    refreshList();
  };

  const filteredIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return watchedIds;
    return watchedIds.filter((id) => gwMap.get(id)?.toLowerCase().includes(q));
  }, [watchedIds, search, gwMap]);

  const limit = repo.getLimit();
  const atLimit = watchedIds.length >= limit;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const capacityBadge = interpolate(copy.playerWatchlistCapacityBadge, {
    count: watchedIds.length,
    limit,
  });

  return (
    <div className={styles.screen}>
      <ScreenHeader
        backLabel={copy.playerWatchlistBack}
        onBack={handleBack}
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

      {watchedIds.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>{copy.playerWatchlistEmpty}</p>
          <p className={styles.emptySubtext}>{copy.playerWatchlistEmptySubtext}</p>
          <Link to="/top-players" className={styles.browseLink}>
            {copy.playerWatchlistBrowse} →
          </Link>
        </div>
      ) : (
        <div className={styles.list}>
          {filteredIds.map((id, i) => (
            <WatchedPlayerRow
              key={id}
              rank={i + 1}
              playerId={id}
              currentGw={currentGw}
              onRemove={() => handleRemove(id)}
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
