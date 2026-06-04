import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useGameweeks, usePlayerPool } from '@/api/queries';
import { PlayerProfileSheet } from '@/components/ui/PlayerProfileSheet/PlayerProfileSheet';
import { PredictedPointsRow } from '@/components/ui/PredictedPointsRow/PredictedPointsRow';
import { PremiumLockedOverlay } from '@/components/ui/PremiumLockedOverlay/PremiumLockedOverlay';
import { PremiumSheet } from '@/components/ui/PremiumSheet/PremiumSheet';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy, interpolate } from '@/lib/copy';
import { useRequestPremiumUpsell } from '@/lib/premium-upsell/PremiumUpsellContext';
import { useFollowPlayer } from '@/lib/use-follow-player';
import { usePremiumStatus } from '@/lib/use-premium-status';
import type { PlayerPosition, PoolPlayer } from '@/types';

import styles from './PredictedPointsScreen.module.css';

type PositionTab = PlayerPosition;

const POSITION_TABS: PositionTab[] = ['GK', 'DEF', 'MID', 'FWD'];
const FREE_TOTAL = 10;
const FREE_VISIBLE = 3;
const PREMIUM_PAGE_SIZE = 20;

function sortByXpts(players: PoolPlayer[]): PoolPlayer[] {
  return [...players].sort((a, b) => parseFloat(b.expectedPoints) - parseFloat(a.expectedPoints));
}

function useProgressiveList(items: PoolPlayer[]) {
  const [visibleCount, setVisibleCount] = useState(PREMIUM_PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setVisibleCount(PREMIUM_PAGE_SIZE);
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + PREMIUM_PAGE_SIZE, items.length));
        }
      },
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items, visibleCount, items.length]);

  return { visible: items.slice(0, visibleCount), sentinelRef, hasMore: visibleCount < items.length };
}

export const PredictedPointsScreen: React.FC = () => {
  const isPremium = usePremiumStatus();
  const requestUpsell = useRequestPremiumUpsell();
  const [activeTab, setActiveTab] = useState<PositionTab>('MID');
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [profilePlayerId, setProfilePlayerId] = useState<number | null>(null);

  const { data: poolData, isLoading } = usePlayerPool();
  const { data: gameweeksData } = useGameweeks();
  const { following, toggle: toggleFollow } = useFollowPlayer(profilePlayerId ?? 0);

  useEffect(() => {
    if (!isPremium) {
      requestUpsell('predictions');
    }
  }, [isPremium, requestUpsell]);

  const nextGw = gameweeksData?.next ?? gameweeksData?.current ?? null;
  const gwLabel = nextGw !== null ? interpolate(copy.predictedPointsGwLabel, { n: nextGw }) : '';

  const sortedForTab = useMemo(() => {
    const players = poolData?.players ?? [];
    return sortByXpts(players.filter((p) => p.position === activeTab));
  }, [poolData, activeTab]);

  const { visible: premiumVisible, sentinelRef, hasMore } = useProgressiveList(sortedForTab);

  const freeRows = sortedForTab.slice(0, FREE_TOTAL);
  const freeVisible = freeRows.slice(0, FREE_VISIBLE);
  const freeLocked = freeRows.slice(FREE_VISIBLE);


  return (
    <div className={styles.screen}>
      <ScreenHeader
        backLabel={copy.squadGuestBack}
        title={copy.predictedPointsTitle}
        right={gwLabel ? <span className={styles.gwLabel}>{gwLabel}</span> : undefined}
      />

      <div className={styles.tabs} role="tablist" aria-label={copy.predictedPointsTitle}>
        {POSITION_TABS.map((pos) => (
          <button
            key={pos}
            type="button"
            role="tab"
            aria-selected={activeTab === pos}
            className={`${styles.tab} ${activeTab === pos ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(pos)}
          >
            {pos}
          </button>
        ))}
      </div>

      <div className={styles.listWrap}>
        {isLoading && <PredictedPointsSkeleton />}

        {!isLoading && sortedForTab.length === 0 && (
          <p className={styles.empty}>{copy.predictedPointsEmptyPosition}</p>
        )}

        {!isLoading && sortedForTab.length > 0 && isPremium && (
          <>
            {premiumVisible.map((player, i) => (
              <PredictedPointsRow
                key={player.id}
                rank={i + 1}
                player={player}
                onSelect={setProfilePlayerId}
              />
            ))}
            {hasMore && <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />}
          </>
        )}

        {!isLoading && sortedForTab.length > 0 && !isPremium && (
          <>
            {freeVisible.map((player, i) => (
              <PredictedPointsRow
                key={player.id}
                rank={i + 1}
                player={player}
                onSelect={setProfilePlayerId}
              />
            ))}
            {freeLocked.length > 0 && (
              <div className={styles.lockedSection}>
                {freeLocked.map((player, i) => (
                  <PredictedPointsRow
                    key={player.id}
                    rank={FREE_VISIBLE + i + 1}
                    player={player}
                    onSelect={() => {}}
                  />
                ))}
                <PremiumLockedOverlay
                  onUnlock={() => setPremiumOpen(true)}
                  label={copy.predictedPointsUnlockLabel}
                />
              </div>
            )}
          </>
        )}
      </div>

      <PremiumSheet
        open={premiumOpen}
        onClose={() => setPremiumOpen(false)}
        title={copy.predictedPointsPremiumTitle}
        description={copy.predictedPointsPremiumDescription}
        freeLabel={copy.predictedPointsPremiumFreeLabel}
        premiumLabel={copy.predictedPointsPremiumPremiumLabel}
      />

      <PlayerProfileSheet
        playerId={profilePlayerId}
        open={profilePlayerId != null}
        onClose={() => setProfilePlayerId(null)}
        onFollow={() => toggleFollow()}
        isFollowing={following}
      />
    </div>
  );
};

PredictedPointsScreen.displayName = 'PredictedPointsScreen';

function PredictedPointsSkeleton() {
  return (
    <div aria-label={copy.loadingPlaceholder} aria-busy="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <div className={`${styles.skeletonCell} ${styles.skeletonRank}`} />
          <div className={`${styles.skeletonCell} ${styles.skeletonJersey}`} />
          <div className={styles.skeletonInfo}>
            <div className={`${styles.skeletonCell} ${styles.skeletonName}`} />
            <div className={`${styles.skeletonCell} ${styles.skeletonMeta}`} />
          </div>
          <div className={`${styles.skeletonCell} ${styles.skeletonXpts}`} />
        </div>
      ))}
    </div>
  );
}
