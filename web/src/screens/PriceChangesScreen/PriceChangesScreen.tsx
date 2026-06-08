import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useGameweeks, usePriceChanges, usePricePredictions } from '@/api/queries';
import { FilterChipBar } from '@/components/ui/FilterChipBar/FilterChipBar';
import { PlayerProfileSheet } from '@/components/ui/PlayerProfileSheet/PlayerProfileSheet';
import { PremiumLockedOverlay } from '@/components/ui/PremiumLockedOverlay/PremiumLockedOverlay';
import { PremiumSheet } from '@/components/ui/PremiumSheet/PremiumSheet';
import { PriceChangeRow } from '@/components/ui/PriceChangeRow/PriceChangeRow';
import { PricePredictionRow } from '@/components/ui/PricePredictionRow/PricePredictionRow';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy } from '@/lib/copy';
import { useFollowPlayer } from '@/lib/use-follow-player';
import { useSubscriptionTier } from '@/lib/use-subscription-tier';
import type {
  PositionFilter,
  PriceChangeDirection,
  PriceChangePeriod,
  PricePredictionDirection,
} from '@/types';
import { MAX_GAMEWEEK } from '@/types';

import styles from './PriceChangesScreen.module.css';

type ScreenMode = 'actual' | 'tonight';
type Scope = 'all' | 'squad';

const POSITION_OPTIONS: readonly { value: PositionFilter; label: string }[] = [
  { value: 'all', label: copy.priceChangesFilterAll },
  { value: 'GK', label: copy.priceChangesFilterGK },
  { value: 'DEF', label: copy.priceChangesFilterDEF },
  { value: 'MID', label: copy.priceChangesFilterMID },
  { value: 'FWD', label: copy.priceChangesFilterFWD },
] as const;

export const PriceChangesScreen: React.FC = () => {
  const tier = useSubscriptionTier();
  const isPremium = tier === 'premium';

  const [mode, setMode] = useState<ScreenMode>('actual');
  const [scope, setScope] = useState<Scope>('all');
  const [period, setPeriod] = useState<PriceChangePeriod>('gw');
  const [actualDirection, setActualDirection] = useState<PriceChangeDirection>('rise');
  const [predictionDirection, setPredictionDirection] =
    useState<PricePredictionDirection>('rise');
  const [position, setPosition] = useState<PositionFilter>('all');
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [profilePlayerId, setProfilePlayerId] = useState<number | null>(null);

  const { data: gameweeksData } = useGameweeks();
  const periodInitialized = useRef(false);

  useEffect(() => {
    if (!periodInitialized.current && gameweeksData) {
      periodInitialized.current = true;
      if (gameweeksData.current >= MAX_GAMEWEEK) {
        setPeriod('season');
      }
    }
  }, [gameweeksData]);

  const squadScope = scope === 'squad';

  const changesQuery = usePriceChanges(
    period,
    actualDirection,
    position,
    squadScope,
    mode === 'actual' && (!squadScope || isPremium)
  );

  const predictionsQuery = usePricePredictions(
    predictionDirection,
    position,
    squadScope,
    mode === 'tonight' && (!squadScope || isPremium)
  );

  const activeQuery = mode === 'actual' ? changesQuery : predictionsQuery;

  const { follow, unfollow, isFollowing } = useFollowPlayer();

  const emptyContent = useMemo((): { heading: string; subtext: string } => {
    if (squadScope) {
      return {
        heading: copy.priceChangesEmptySquadHeading,
        subtext: copy.priceChangesEmptySquadSubtext,
      };
    }
    if (mode === 'tonight') {
      return {
        heading: copy.priceChangesEmptyTonightHeading,
        subtext: copy.priceChangesEmptyTonightSubtext,
      };
    }
    if (period === 'season') {
      return {
        heading: copy.priceChangesEmptySeasonHeading,
        subtext: copy.priceChangesEmptySeasonSubtext,
      };
    }
    return {
      heading: copy.priceChangesEmptyGwHeading,
      subtext: copy.priceChangesEmptyGwSubtext,
    };
  }, [mode, period, squadScope]);

  const players = mode === 'actual' ? changesQuery.data?.players : predictionsQuery.data?.players;

  const handleFollow = (playerId: number) => {
    if (isFollowing(playerId)) {
      unfollow(playerId);
    } else {
      follow(playerId);
    }
  };

  return (
    <div className={styles.screen}>
      <ScreenHeader backLabel={copy.squadGuestBack} title={copy.priceChangesTitle} />

      <div className={styles.tabs} role="tablist" aria-label={copy.priceChangesTitle}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'actual'}
          className={`${styles.tab} ${mode === 'actual' ? styles.tabActive : ''}`}
          onClick={() => setMode('actual')}
        >
          {copy.priceChangesActualTab}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'tonight'}
          className={`${styles.tab} ${mode === 'tonight' ? styles.tabActive : ''}`}
          onClick={() => setMode('tonight')}
        >
          {copy.priceChangesTonightTab}
        </button>
      </div>

      <div className={styles.subTabs}>
        <button
          type="button"
          className={`${styles.subTab} ${scope === 'all' ? styles.subTabActive : ''}`}
          onClick={() => setScope('all')}
        >
          {copy.priceChangesAllFpl}
        </button>
        <button
          type="button"
          className={`${styles.subTab} ${scope === 'squad' ? styles.subTabActive : ''}`}
          onClick={() => setScope('squad')}
        >
          {copy.priceChangesMySquad}
        </button>
      </div>

      {mode === 'actual' && (
        <div className={styles.subTabs}>
          <button
            type="button"
            className={`${styles.subTab} ${period === 'gw' ? styles.subTabActive : ''}`}
            onClick={() => setPeriod('gw')}
          >
            {copy.priceChangesThisGw}
          </button>
          <button
            type="button"
            className={`${styles.subTab} ${period === 'season' ? styles.subTabActive : ''}`}
            onClick={() => setPeriod('season')}
          >
            {copy.priceChangesSeason}
          </button>
        </div>
      )}

      <div className={styles.subTabs}>
        {mode === 'actual' ? (
          <>
            <button
              type="button"
              className={`${styles.subTab} ${actualDirection === 'rise' ? styles.subTabActive : ''}`}
              onClick={() => setActualDirection('rise')}
            >
              {copy.priceChangesRisers}
            </button>
            <button
              type="button"
              className={`${styles.subTab} ${actualDirection === 'fall' ? styles.subTabActive : ''}`}
              onClick={() => setActualDirection('fall')}
            >
              {copy.priceChangesFallers}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={`${styles.subTab} ${predictionDirection === 'rise' ? styles.subTabActive : ''}`}
              onClick={() => setPredictionDirection('rise')}
            >
              {copy.priceChangesLikelyRise}
            </button>
            <button
              type="button"
              className={`${styles.subTab} ${predictionDirection === 'fall' ? styles.subTabActive : ''}`}
              onClick={() => setPredictionDirection('fall')}
            >
              {copy.priceChangesLikelyFall}
            </button>
          </>
        )}
      </div>

      <FilterChipBar
        options={POSITION_OPTIONS}
        value={position}
        onChange={(v) => setPosition(v as PositionFilter)}
        ariaLabel="Position filter"
      />

      <div className={styles.listWrap}>
        {squadScope && !isPremium && (
          <PremiumLockedOverlay onUnlock={() => setPremiumOpen(true)} />
        )}

        {activeQuery.isLoading && (!squadScope || isPremium) && (
          <p className={styles.message}>{copy.leagueStandingsLoading}</p>
        )}

        {activeQuery.isError && (!squadScope || isPremium) && (
          <div className={styles.message}>
            <p>{copy.priceChangesLoadError}</p>
            <button type="button" className={styles.retry} onClick={() => activeQuery.refetch()}>
              {copy.priceChangesRetry}
            </button>
          </div>
        )}

        {(!squadScope || isPremium) && !activeQuery.isLoading && !activeQuery.isError && (
          <>
            {players && players.length === 0 && (
              <div className={styles.emptyState}>
                <p className={styles.emptyHeading}>{emptyContent.heading}</p>
                <p className={styles.emptySubtext}>{emptyContent.subtext}</p>
              </div>
            )}
            {mode === 'actual' &&
              changesQuery.data?.players.map((player, i) => (
                <PriceChangeRow
                  key={player.id}
                  rank={i + 1}
                  player={player}
                  onSelect={setProfilePlayerId}
                />
              ))}
            {mode === 'tonight' &&
              predictionsQuery.data?.players.map((player, i) => (
                <PricePredictionRow
                  key={player.id}
                  rank={i + 1}
                  player={player}
                  onSelect={setProfilePlayerId}
                />
              ))}
          </>
        )}
      </div>

      {mode === 'tonight' && (
        <p className={styles.disclaimer}>{copy.priceChangesDisclaimer}</p>
      )}

      <PremiumSheet
        open={premiumOpen}
        onClose={() => setPremiumOpen(false)}
        title={copy.priceChangesPremiumTitle}
        description={copy.priceChangesPremiumDescription}
        freeLabel={copy.priceChangesPremiumFreeLabel}
        premiumLabel={copy.priceChangesPremiumPremiumLabel}
      />

      <PlayerProfileSheet
        playerId={profilePlayerId}
        open={profilePlayerId != null}
        onClose={() => setProfilePlayerId(null)}
        onFollow={handleFollow}
        isFollowing={profilePlayerId != null ? isFollowing(profilePlayerId) : false}
      />
    </div>
  );
};

PriceChangesScreen.displayName = 'PriceChangesScreen';
