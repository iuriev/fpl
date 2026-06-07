import React, { useMemo, useState } from 'react';

import { useGameweeks, useMarket } from '@/api/queries';
import { PremiumLockedOverlay } from '@/components/ui/PremiumLockedOverlay/PremiumLockedOverlay';
import { PremiumSheet } from '@/components/ui/PremiumSheet/PremiumSheet';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy, interpolate } from '@/lib/copy';
import { useRequestPremiumUpsell } from '@/lib/premium-upsell/PremiumUpsellContext';
import { usePremiumStatus } from '@/lib/use-premium-status';
import type { TeamMarketDto } from '@/types';

import styles from './MarketScreen.module.css';

type MarketTab = 'cs' | 'xg';

const FREE_VISIBLE = 5;

function FixtureChip({ shortName, isHome }: { shortName: string; isHome: boolean }) {
  return (
    <span className={`${styles.chip} ${isHome ? styles.chipHome : styles.chipAway}`}>
      {shortName} ({isHome ? 'H' : 'A'})
    </span>
  );
}

function TeamRow({
  team,
  rank,
  tab,
  maxValue,
}: {
  team: TeamMarketDto;
  rank: number;
  tab: MarketTab;
  maxValue: number;
}) {
  const value = tab === 'cs' ? team.csProb : team.xG;
  const displayValue =
    tab === 'cs' ? `${(value * 100).toFixed(0)}%` : value.toFixed(2);
  const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className={styles.row}>
      <span className={styles.rank}>{rank}</span>
      <div className={styles.teamInfo}>
        <span className={styles.teamName}>{team.teamShortName}</span>
        <div className={styles.chips}>
          {team.fixtures.map((f) => (
            <FixtureChip
              key={f.opponentTeamId}
              shortName={f.opponentShortName}
              isHome={f.isHome}
            />
          ))}
        </div>
      </div>
      <div className={styles.valueCol}>
        <span className={styles.value}>{displayValue}</span>
        <div className={styles.barTrack}>
          <div className={styles.barFill} style={{ width: `${barWidth}%` }} />
        </div>
      </div>
    </div>
  );
}

function MarketSkeleton() {
  return (
    <div aria-label={copy.loadingPlaceholder} aria-busy="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <div className={`${styles.skeletonCell} ${styles.skeletonRank}`} />
          <div className={styles.skeletonInfo}>
            <div className={`${styles.skeletonCell} ${styles.skeletonName}`} />
            <div className={`${styles.skeletonCell} ${styles.skeletonChip}`} />
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

  const { data: gameweeksData } = useGameweeks();
  const nextGw = gameweeksData?.next ?? gameweeksData?.current ?? null;
  const { data: marketData, isLoading } = useMarket(nextGw);

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
  const isEmpty = !isLoading && marketData != null && !marketData.ready;

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
        {isLoading && <MarketSkeleton />}

        {isEmpty && (
          <p className={styles.empty}>
            {nextGw !== null
              ? interpolate(copy.marketEmptyState, { n: nextGw })
              : copy.marketEmptyState.replace(' GW {n}', '')}
          </p>
        )}

        {!isLoading && sorted.length > 0 && isPremium && (
          <>
            {sorted.map((team, i) => (
              <TeamRow key={team.teamId} team={team} rank={i + 1} tab={activeTab} maxValue={maxValue} />
            ))}
            <p className={styles.disclaimer}>{copy.marketDisclaimer}</p>
          </>
        )}

        {!isLoading && sorted.length > 0 && !isPremium && (
          <>
            {freeRows.map((team, i) => (
              <TeamRow key={team.teamId} team={team} rank={i + 1} tab={activeTab} maxValue={maxValue} />
            ))}
            {lockedRows.length > 0 && (
              <div className={styles.lockedSection}>
                {lockedRows.map((team, i) => (
                  <TeamRow
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
