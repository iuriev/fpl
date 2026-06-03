import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useSearchParams } from 'react-router-dom';

import { useGameweeks, useLeaderboardGw, useLeaderboardSeason } from '@/api/queries';
import { BottomSheet } from '@/components/ui/BottomSheet/BottomSheet';
import { Button } from '@/components/ui/Button/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy } from '@/lib/copy';
import { useFollowPlayer } from '@/lib/use-follow-player';
import type { LeaderboardPlayer } from '@/types';
import { MAX_GAMEWEEK } from '@/types';

import styles from './LeaderboardScreen.module.css';

type Tab = 'gw' | 'season';

const PAGE_SIZE = 20;
const EMPTY: LeaderboardPlayer[] = [];

function withTransition(update: () => void): void {
  if (!document.startViewTransition) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}

function useProgressiveList(items: LeaderboardPlayer[]) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setVisibleCount(PAGE_SIZE);
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= items.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisibleCount((c) => Math.min(c + PAGE_SIZE, items.length));
      },
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items, visibleCount, items.length]);

  return { visible: items.slice(0, visibleCount), sentinelRef, hasMore: visibleCount < items.length };
}

export const LeaderboardScreen: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: gameweeksData } = useGameweeks();

  const finishedGws = useMemo(
    () => gameweeksData?.gameweeks.filter((gw) => gw.finished) ?? [],
    [gameweeksData]
  );
  const currentGw = gameweeksData?.gameweeks.find((gw) => !gw.finished && gw.id > 1);
  const latestFinishedGw = finishedGws.length > 0 ? finishedGws[finishedGws.length - 1].id : null;

  const tabParam = searchParams.get('tab');
  const activeTab: Tab = tabParam === 'season' ? 'season' : 'gw';

  const gwParam = searchParams.get('gw');
  const selectedGw = useMemo(() => {
    if (gwParam) {
      const n = Number(gwParam);
      if (Number.isInteger(n) && n >= 1 && n <= MAX_GAMEWEEK) return n;
    }
    return latestFinishedGw;
  }, [gwParam, latestFinishedGw]);

  const [gwPickerOpen, setGwPickerOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardPlayer | null>(null);

  const setTab = (tab: Tab) => {
    withTransition(() =>
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set('tab', tab);
        return p;
      })
    );
  };

  const selectGw = (gw: number) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('gw', String(gw));
      return p;
    });
    setGwPickerOpen(false);
  };

  const gwQuery = useLeaderboardGw(activeTab === 'gw' ? selectedGw : null);
  const seasonQuery = useLeaderboardSeason();

  const isLoading = activeTab === 'gw' ? gwQuery.isLoading : seasonQuery.isLoading;
  const isError = activeTab === 'gw' ? gwQuery.isError : seasonQuery.isError;
  const refetch = activeTab === 'gw' ? gwQuery.refetch : seasonQuery.refetch;

  const defconPlayers = activeTab === 'gw' ? (gwQuery.data?.defcon ?? EMPTY) : (seasonQuery.data?.defcon ?? EMPTY);
  const bpsPlayers = activeTab === 'gw' ? (gwQuery.data?.bps ?? EMPTY) : (seasonQuery.data?.bps ?? EMPTY);

  const defcon = useProgressiveList(defconPlayers);
  const bps = useProgressiveList(bpsPlayers);

  const gwLabel = selectedGw !== null ? `GW ${selectedGw}` : '—';

  const allSelectableGws = useMemo(() => {
    const finished = finishedGws.map((gw) => ({ id: gw.id, live: false }));
    if (currentGw) return [...finished, { id: currentGw.id, live: true }];
    return finished;
  }, [finishedGws, currentGw]);

  return (
    <div className={styles.screen}>
      <ScreenHeader backTo="/" backLabel={copy.leaderboardBack} title={copy.leaderboardTitle} />

      <div className={styles.tabs} role="tablist" aria-label={copy.leaderboardTitle}>
        <button
          role="tab"
          aria-selected={activeTab === 'gw'}
          className={`${styles.tab} ${activeTab === 'gw' ? styles.tabActive : ''}`}
          onClick={() => setTab('gw')}
        >
          GW
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'season'}
          className={`${styles.tab} ${activeTab === 'season' ? styles.tabActive : ''}`}
          onClick={() => setTab('season')}
        >
          Season
        </button>
      </div>

      {activeTab === 'gw' && (
        <div className={styles.gwPickerRow}>
          <button
            className={styles.gwPickerBtn}
            onClick={() => setGwPickerOpen(true)}
            aria-label={gwLabel}
          >
            {gwLabel}
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={styles.gwPickerChevron}>
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      <div className={styles.body}>
        {isLoading && <LeaderboardSkeleton />}

        {isError && (
          <div className={styles.stateCenter}>
            <p className={styles.stateText}>{copy.leaderboardLoadError}</p>
            <Button variant="secondary" onClick={() => refetch()}>{copy.leaderboardRetry}</Button>
          </div>
        )}

        {!isLoading && !isError && (
          <div className={styles.columns}>
            <div className={styles.column}>
              <div className={`${styles.columnHeader} ${styles.defconHeader}`}>DEFCON</div>
              {defcon.visible.map((player, i) => (
                <PlayerRow
                  key={player.id}
                  rank={i + 1}
                  player={player}
                  valueClass={styles.defconValue}
                  onTap={() => setSelectedPlayer(player)}
                />
              ))}
              {defcon.hasMore && <div ref={defcon.sentinelRef} className={styles.sentinel} aria-hidden="true" />}
            </div>

            <div className={styles.divider} />

            <div className={styles.column}>
              <div className={`${styles.columnHeader} ${styles.bpsHeader}`}>BPS</div>
              {bps.visible.map((player, i) => (
                <PlayerRow
                  key={player.id}
                  rank={i + 1}
                  player={player}
                  valueClass={styles.bpsValue}
                  onTap={() => setSelectedPlayer(player)}
                />
              ))}
              {bps.hasMore && <div ref={bps.sentinelRef} className={styles.sentinel} aria-hidden="true" />}
            </div>
          </div>
        )}
      </div>

      <BottomSheet open={gwPickerOpen} onClose={() => setGwPickerOpen(false)} title="Select Gameweek">
        {gwPickerOpen && (
          <div className={styles.gwList}>
            {allSelectableGws.map(({ id, live }) => (
              <button
                key={id}
                className={`${styles.gwOption} ${id === selectedGw ? styles.gwOptionSelected : ''}`}
                aria-pressed={id === selectedGw}
                onClick={() => selectGw(id)}
              >
                GW {id}
                {live && <span className={styles.gwOptionLive}>Live</span>}
              </button>
            ))}
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        open={selectedPlayer !== null}
        onClose={() => setSelectedPlayer(null)}
        title="Player"
      >
        {selectedPlayer && <PlayerInfoSheet player={selectedPlayer} />}
      </BottomSheet>
    </div>
  );
};

LeaderboardScreen.displayName = 'LeaderboardScreen';

function PlayerRow({
  rank,
  player,
  valueClass,
  onTap,
}: {
  rank: number;
  player: LeaderboardPlayer;
  valueClass: string;
  onTap: () => void;
}) {
  return (
    <button
      className={styles.row}
      onClick={onTap}
    >
      <span className={styles.rank}>{rank}</span>
      <span className={styles.name}>{player.webName}</span>
      <span className={`${styles.value} ${valueClass}`}>{player.value}</span>
    </button>
  );
}

function PlayerInfoSheet({ player }: { player: LeaderboardPlayer }) {
  const { following, toggle } = useFollowPlayer(player.id);
  return (
    <div className={styles.playerSheetBody}>
      <p className={styles.playerSheetName}>{player.webName}</p>
      <p className={styles.playerSheetMeta}>{player.position} · {player.teamShortName}</p>
      <Button variant={following ? 'secondary' : 'primary'} onClick={() => toggle()}>
        {following ? 'Unfollow' : 'Follow'}
      </Button>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className={styles.skeletonColumns} aria-label="Loading leaderboard" aria-busy="true">
      <div className={styles.skeletonColumn}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={styles.skeletonRow} />
        ))}
      </div>
      <div className={styles.divider} />
      <div className={styles.skeletonColumn}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={styles.skeletonRow} />
        ))}
      </div>
    </div>
  );
}
