import React, { useEffect, useMemo, useRef, useState } from 'react';

import { usePlayerPool, useTopPlayersGw, useTopPlayersSeason } from '@/api/queries';
import { BottomSheet } from '@/components/ui/BottomSheet/BottomSheet';
import { copy } from '@/lib/copy';
import { useFollowPlayer } from '@/lib/use-follow-player';
import type { PoolPlayer, TopPlayersPlayer } from '@/types';

import styles from './AddPlayerSheet.module.css';

const PAGE_SIZE = 50;

export interface AddPlayerSheetProps {
  open: boolean;
  onClose: () => void;
  currentGw: number | null;
}

function toTopPlayersPlayer(p: PoolPlayer, gwMap: Map<number, TopPlayersPlayer>): TopPlayersPlayer {
  const gw = gwMap.get(p.id);
  return {
    id: p.id,
    webName: p.webName,
    position: p.position,
    teamCode: p.teamCode,
    teamShortName: p.teamShortName,
    points: gw?.points ?? p.eventPoints,
    selectedByPercent: p.selectedByPercent,
    statBreakdown: gw?.statBreakdown,
  };
}

function FollowableResult({
  rank,
  player,
}: {
  rank: number;
  player: TopPlayersPlayer;
}) {
  const { following, toggle } = useFollowPlayer(player.id);

  return (
    <div className={styles.resultRow}>
      <span className={styles.rank}>{rank}</span>
      <div className={styles.playerInfo}>
        <span className={styles.name}>{player.webName}</span>
        <span className={styles.meta}>
          {player.position} · {player.teamShortName} · {player.selectedByPercent}%
        </span>
      </div>
      <span className={styles.points}>{player.points}</span>
      <button
        className={`${styles.followBtn} ${following ? styles.followBtnActive : ''}`}
        onClick={() => toggle()}
        aria-label={following ? copy.playerWatchlistUnfollow : copy.playerWatchlistFollow}
        aria-pressed={following}
      >
        {following ? '★' : '☆'}
      </button>
    </div>
  );
}

export const AddPlayerSheet: React.FC<AddPlayerSheetProps> = ({ open, onClose, currentGw }) => {
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: poolData } = usePlayerPool();
  const gwQuery = useTopPlayersGw(currentGw);
  const seasonQuery = useTopPlayersSeason();

  const gwMap = useMemo(() => {
    const map = new Map<number, TopPlayersPlayer>();
    for (const p of gwQuery.data?.players ?? []) map.set(p.id, p);
    for (const p of seasonQuery.data?.players ?? []) if (!map.has(p.id)) map.set(p.id, p);
    return map;
  }, [gwQuery.data, seasonQuery.data]);

  const filtered = useMemo(() => {
    if (!poolData) return [];
    const q = query.trim().toLowerCase();
    const players = q
      ? poolData.players.filter(
          (p) =>
            p.webName.toLowerCase().includes(q) ||
            p.firstName.toLowerCase().includes(q) ||
            p.lastName.toLowerCase().includes(q),
        )
      : poolData.players;
    return players.map((p) => toTopPlayersPlayer(p, gwMap));
  }, [poolData, query, gwMap]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= filtered.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
        }
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filtered, visibleCount]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <BottomSheet open={open} onClose={onClose} title={copy.playerWatchlistAddSheetTitle}>
      <div className={styles.sheet}>
        <div className={styles.searchWrap}>
          <input
            className={styles.search}
            type="search"
            placeholder={copy.playerWatchlistAddSearch}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div className={styles.results}>
          {visible.map((player, i) => (
            <FollowableResult key={player.id} rank={i + 1} player={player} />
          ))}
          {visibleCount < filtered.length && (
            <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
          )}
          {filtered.length === 0 && query.trim() !== '' && (
            <p className={styles.empty}>No players found</p>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

AddPlayerSheet.displayName = 'AddPlayerSheet';
