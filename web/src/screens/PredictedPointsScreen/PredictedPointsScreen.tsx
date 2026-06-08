import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useGameweeks, usePlayerPool, usePredictions } from '@/api/queries';
import { PredictedPointsRow } from '@/components/ui/PredictedPointsRow/PredictedPointsRow';
import { PremiumLockedOverlay } from '@/components/ui/PremiumLockedOverlay/PremiumLockedOverlay';
import { PremiumSheet } from '@/components/ui/PremiumSheet/PremiumSheet';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy, interpolate } from '@/lib/copy';
import {
  buildPredictedPointsRows,
  type PredictedPointsRowData,
} from '@/lib/predicted-points';
import { useRequestPremiumUpsell } from '@/lib/premium-upsell/PremiumUpsellContext';
import { usePremiumStatus } from '@/lib/use-premium-status';
import type { PlayerPosition } from '@/types';

import styles from './PredictedPointsScreen.module.css';

type PositionTab = PlayerPosition;

const POSITION_TABS: PositionTab[] = ['GK', 'DEF', 'MID', 'FWD'];
const FREE_TOTAL = 10;
const FREE_VISIBLE = 3;
const PREMIUM_PAGE_SIZE = 20;

function listItemsKey(items: PredictedPointsRowData[]): string {
  return items.map((r) => `${r.player.id}:${r.displayValue}`).join(',');
}

function PremiumPredictedList({ rows }: { rows: PredictedPointsRowData[] }) {
  const [visibleCount, setVisibleCount] = useState(PREMIUM_PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= rows.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + PREMIUM_PAGE_SIZE, rows.length));
        }
      },
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [rows, visibleCount, rows.length]);

  const visible = rows.slice(0, visibleCount);
  const hasMore = visibleCount < rows.length;

  return (
    <>
      {visible.map((row, i) => (
        <PredictedPointsRow key={row.player.id} rank={i + 1} row={row} />
      ))}
      {hasMore && <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />}
    </>
  );
}

export const PredictedPointsScreen: React.FC = () => {
  const isPremium = usePremiumStatus();
  const requestUpsell = useRequestPremiumUpsell();
  const [activeTab, setActiveTab] = useState<PositionTab>('MID');
  const [premiumOpen, setPremiumOpen] = useState(false);

  const { data: poolData, isLoading: poolLoading } = usePlayerPool();
  const { data: gameweeksData, isLoading: gameweeksLoading } = useGameweeks();

  const nextGw = gameweeksData?.next ?? gameweeksData?.current ?? null;
  const { data: predictionsData, isLoading: predictionsLoading } = usePredictions(nextGw);

  useEffect(() => {
    if (!isPremium) {
      requestUpsell('predictions');
    }
  }, [isPremium, requestUpsell]);

  const gwLabel = nextGw !== null ? interpolate(copy.predictedPointsGwLabel, { n: nextGw }) : '';

  const sortedForTab = useMemo(() => {
    const players = poolData?.players ?? [];
    const filtered = players.filter((p) => p.position === activeTab);
    return buildPredictedPointsRows(filtered, predictionsData);
  }, [poolData, activeTab, predictionsData]);

  const listKey = listItemsKey(sortedForTab);

  const freeRows = sortedForTab.slice(0, FREE_TOTAL);
  const freeVisible = freeRows.slice(0, FREE_VISIBLE);
  const freeLocked = freeRows.slice(FREE_VISIBLE);

  const isLoading = poolLoading || gameweeksLoading || predictionsLoading;
  const modelReady = predictionsData?.ready === true;
  const showFplFallback =
    !predictionsLoading && nextGw != null && predictionsData != null && !modelReady;

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

      {showFplFallback && (
        <p className={styles.fallbackNotice}>{copy.predictedPointsFplFallback}</p>
      )}

      <div className={styles.listWrap}>
        {isLoading && <PredictedPointsSkeleton />}

        {!isLoading && sortedForTab.length === 0 && (
          <p className={styles.empty}>{copy.predictedPointsEmptyPosition}</p>
        )}

        {!isLoading && sortedForTab.length > 0 && isPremium && (
          <PremiumPredictedList
            key={listKey}
            rows={sortedForTab}
          />
        )}

        {!isLoading && sortedForTab.length > 0 && !isPremium && (
          <>
            {freeVisible.map((row, i) => (
              <PredictedPointsRow
                key={row.player.id}
                rank={i + 1}
                row={row}
              />
            ))}
            {freeLocked.length > 0 && (
              <div className={styles.lockedSection}>
                {freeLocked.map((row, i) => (
                  <PredictedPointsRow
                    key={row.player.id}
                    rank={FREE_VISIBLE + i + 1}
                    row={row}
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

        {!isLoading && sortedForTab.length > 0 && modelReady && (
          <p className={styles.disclaimer}>{copy.predictedPointsDisclaimer}</p>
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
