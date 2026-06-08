import React, { useMemo, useState } from 'react';

import { useGameweeks, useMarket } from '@/api/queries';
import { MarketTeamRow } from '@/components/ui/MarketTeamRow/MarketTeamRow';
import { PremiumLockedOverlay } from '@/components/ui/PremiumLockedOverlay/PremiumLockedOverlay';
import { PremiumSheet } from '@/components/ui/PremiumSheet/PremiumSheet';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy, interpolate } from '@/lib/copy';
import { useRequestPremiumUpsell } from '@/lib/premium-upsell/PremiumUpsellContext';
import { useStartupReadiness } from '@/lib/startup-readiness/StartupReadinessContext';
import { usePredictionsWarmupRefetch } from '@/lib/startup-readiness/use-predictions-warmup-refetch';
import { isPredictionsWarmupActive } from '@/lib/startup-readiness/warmup-status';
import { usePremiumStatus } from '@/lib/use-premium-status';

import styles from './MarketScreen.module.css';

type MarketTab = 'cs' | 'xg';

const FREE_VISIBLE = 5;

function MarketSkeleton() {
  return (
    <div aria-label={copy.loadingPlaceholder} aria-busy="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <div className={`${styles.skeletonCell} ${styles.skeletonRank}`} />
          <div className={`${styles.skeletonCell} ${styles.skeletonBadge}`} />
          <div className={styles.skeletonInfo}>
            <div className={`${styles.skeletonCell} ${styles.skeletonName}`} />
            <div className={`${styles.skeletonCell} ${styles.skeletonFixture}`} />
          </div>
          <div className={`${styles.skeletonCell} ${styles.skeletonValue}`} />
        </div>
      ))}
    </div>
  );
}

export const MarketScreen: React.FC = () => {
  const isPremium = usePremiumStatus();
  const requestUpsell = useRequestPremiumUpsell();
  const [activeTab, setActiveTab] = useState<MarketTab>('cs');
  const [premiumOpen, setPremiumOpen] = useState(false);

  const { health } = useStartupReadiness();
  const predictionsWarmupActive = isPredictionsWarmupActive(health);
  const { data: gameweeksData } = useGameweeks();
  const nextGw = gameweeksData?.next ?? gameweeksData?.current ?? null;
  const { data: marketData, isLoading } = useMarket(nextGw);

  usePredictionsWarmupRefetch(nextGw);

  const sorted = useMemo(() => {
    const teams = marketData?.teams ?? [];
    return [...teams].sort((a, b) =>
      activeTab === 'cs' ? b.csProb - a.csProb : b.xG - a.xG,
    );
  }, [marketData, activeTab]);

  const maxValue = useMemo(() => {
    if (sorted.length === 0) return 1;
    return activeTab === 'cs'
      ? Math.max(...sorted.map((t) => t.csProb))
      : Math.max(...sorted.map((t) => t.xG));
  }, [sorted, activeTab]);

  const gwLabel = nextGw !== null ? interpolate(copy.marketGwLabel, { n: nextGw }) : '';
  const showLoading = isLoading || (predictionsWarmupActive && sorted.length === 0);
  const isEmpty =
    !showLoading && (marketData == null || !marketData.ready) && sorted.length === 0;
  const calculatingMessage =
    nextGw !== null
      ? interpolate(copy.marketCalculatingState, { n: nextGw })
      : copy.marketCalculatingState.replace(' GW {n}', '');

  const freeRows = sorted.slice(0, FREE_VISIBLE);
  const lockedRows = sorted.slice(FREE_VISIBLE);

  return (
    <div className={styles.screen}>
      <ScreenHeader
        title={copy.marketTitle}
        right={gwLabel ? <span className={styles.gwLabel}>{gwLabel}</span> : undefined}
      />

      <div className={styles.tabs} role="tablist" aria-label={copy.marketTitle}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'cs'}
          className={`${styles.tab} ${activeTab === 'cs' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('cs')}
        >
          {copy.marketTabCS}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'xg'}
          className={`${styles.tab} ${activeTab === 'xg' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('xg')}
        >
          {copy.marketTabXG}
        </button>
      </div>

      <div className={styles.listWrap}>
        {showLoading && <MarketSkeleton />}

        {showLoading && predictionsWarmupActive && (
          <p className={styles.calculating}>{calculatingMessage}</p>
        )}

        {isEmpty && (
          <p className={styles.empty}>
            {nextGw !== null
              ? interpolate(copy.marketEmptyState, { n: nextGw })
              : copy.marketEmptyState.replace(' GW {n}', '')}
          </p>
        )}

        {!showLoading && sorted.length > 0 && isPremium && (
          <>
            {sorted.map((team, i) => (
              <MarketTeamRow key={team.teamId} team={team} rank={i + 1} tab={activeTab} maxValue={maxValue} />
            ))}
            <p className={styles.disclaimer}>{copy.marketDisclaimer}</p>
          </>
        )}

        {!showLoading && sorted.length > 0 && !isPremium && (
          <>
            {freeRows.map((team, i) => (
              <MarketTeamRow key={team.teamId} team={team} rank={i + 1} tab={activeTab} maxValue={maxValue} />
            ))}
            {lockedRows.length > 0 && (
              <div className={styles.lockedSection}>
                {lockedRows.map((team, i) => (
                  <MarketTeamRow
                    key={team.teamId}
                    team={team}
                    rank={FREE_VISIBLE + i + 1}
                    tab={activeTab}
                    maxValue={maxValue}
                  />
                ))}
                <PremiumLockedOverlay
                  onUnlock={() => {
                    requestUpsell('market');
                    setPremiumOpen(true);
                  }}
                  label={copy.marketUnlockLabel}
                />
              </div>
            )}
            <p className={styles.disclaimer}>{copy.marketDisclaimer}</p>
          </>
        )}
      </div>

      <PremiumSheet
        open={premiumOpen}
        onClose={() => setPremiumOpen(false)}
        title={copy.marketPremiumTitle}
        description={copy.marketPremiumDescription}
        freeLabel={copy.marketPremiumFreeLabel}
        premiumLabel={copy.marketPremiumPremiumLabel}
      />
    </div>
  );
};

MarketScreen.displayName = 'MarketScreen';
