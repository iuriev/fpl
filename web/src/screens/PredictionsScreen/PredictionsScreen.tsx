import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useGameweeks, useMarket, usePlayerPool, usePredictedLineups, usePredictions } from '@/api/queries';
import { MarketTeamRow } from '@/components/ui/MarketTeamRow/MarketTeamRow';
import { PlayerProfileSheet } from '@/components/ui/PlayerProfileSheet/PlayerProfileSheet';
import { PredictedPointsRow } from '@/components/ui/PredictedPointsRow/PredictedPointsRow';
import { PremiumLockedOverlay } from '@/components/ui/PremiumLockedOverlay/PremiumLockedOverlay';
import { PremiumSheet } from '@/components/ui/PremiumSheet/PremiumSheet';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { TeamPickerGrid } from '@/components/ui/TeamPickerGrid/TeamPickerGrid';
import { copy, interpolate } from '@/lib/copy';
import {
  buildPredictedPointsRows,
  type PredictedPointsRowData,
} from '@/lib/predicted-points';
import { useRequestPremiumUpsell } from '@/lib/premium-upsell/PremiumUpsellContext';
import { useFollowPlayer } from '@/lib/use-follow-player';
import { usePremiumStatus } from '@/lib/use-premium-status';
import { PredictedLineupPitch } from '@/screens/PredictedLineupsScreen/PredictedLineupPitch';
import type { PlayerPosition } from '@/types';

import styles from './PredictionsScreen.module.css';

// ── Types ─────────────────────────────────────────────────

type MainTab = 'points' | 'lineups' | 'cs' | 'xg';
type PositionTab = PlayerPosition;

const MAIN_TABS: { slug: MainTab; label: string }[] = [
  { slug: 'points', label: copy.predictionsTabPoints },
  { slug: 'lineups', label: copy.predictionsTabLineups },
  { slug: 'cs', label: copy.predictionsTabCS },
  { slug: 'xg', label: copy.predictionsTabXG },
];

const POSITION_TABS: PositionTab[] = ['GK', 'DEF', 'MID', 'FWD'];
const FREE_TOTAL = 10;
const FREE_VISIBLE = 3;
const PREMIUM_PAGE_SIZE = 20;

// ── Points sub-components ─────────────────────────────────

function PremiumPointsList({
  rows,
  onSelect,
}: {
  rows: PredictedPointsRowData[];
  onSelect: (id: number) => void;
}) {
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
  return (
    <>
      {visible.map((row, i) => (
        <PredictedPointsRow key={row.player.id} rank={i + 1} row={row} onSelect={onSelect} />
      ))}
      {visibleCount < rows.length && (
        <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      )}
    </>
  );
}

function PointsSkeleton() {
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

// ── Market sub-components ─────────────────────────────────

function MarketSkeleton() {
  return (
    <div aria-label={copy.loadingPlaceholder} aria-busy="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={styles.marketSkeletonRow}>
          <div className={`${styles.skeletonCell} ${styles.marketSkeletonRank}`} />
          <div className={`${styles.skeletonCell} ${styles.marketSkeletonBadge}`} />
          <div className={styles.marketSkeletonInfo}>
            <div className={`${styles.skeletonCell} ${styles.marketSkeletonName}`} />
            <div className={`${styles.skeletonCell} ${styles.marketSkeletonFixture}`} />
          </div>
          <div className={`${styles.skeletonCell} ${styles.marketSkeletonValue}`} />
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────

export const PredictionsScreen: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isPremium = usePremiumStatus();
  const requestUpsell = useRequestPremiumUpsell();

  // ── Tab state ──────────────────────────────────────────
  const tabParam = searchParams.get('tab');
  const activeTab: MainTab = (['points', 'lineups', 'cs', 'xg'] as MainTab[]).includes(tabParam as MainTab)
    ? (tabParam as MainTab)
    : 'points';

  const setTab = (tab: MainTab) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', tab);
      return p;
    });
  };

  // ── Shared queries ─────────────────────────────────────
  const { data: gameweeksData } = useGameweeks();
  const nextGw = gameweeksData?.next ?? gameweeksData?.current ?? null;

  // ── Points state & queries ─────────────────────────────
  const [posTab, setPosTab] = useState<PositionTab>('MID');
  const { data: poolData, isLoading: poolLoading } = usePlayerPool();
  const { data: predictionsData, isLoading: predictionsLoading } = usePredictions(nextGw);

  // ── Lineups state & queries ────────────────────────────
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const lineupsQuery = usePredictedLineups(nextGw, isPremium);

  const teams = useMemo(() => lineupsQuery.data?.teams ?? [], [lineupsQuery.data]);
  const defaultTeamId = useMemo(() => {
    if (teams.length === 0) return null;
    const sorted = [...teams].sort((a, b) => a.shortName.localeCompare(b.shortName));
    return sorted[0]?.teamId ?? null;
  }, [teams]);
  const resolvedTeamId = selectedTeamId ?? defaultTeamId;
  const activeTeam = teams.find((t) => t.teamId === resolvedTeamId) ?? teams[0];

  const fixtureLabel = activeTeam?.nextFixture != null
    ? interpolate(
        activeTeam.nextFixture.isHome
          ? copy.predictedLineupsVsHome
          : copy.predictedLineupsVsAway,
        { opponent: activeTeam.nextFixture.opponentShortName }
      )
    : null;

  // ── Market queries (shared for CS% + xG) ──────────────
  const { data: marketData, isLoading: marketLoading } = useMarket(nextGw);

  const csSorted = useMemo(() => {
    const list = marketData?.teams ?? [];
    return [...list].sort((a, b) => b.csProb - a.csProb);
  }, [marketData]);

  const xgSorted = useMemo(() => {
    const list = marketData?.teams ?? [];
    return [...list].sort((a, b) => b.xG - a.xG);
  }, [marketData]);

  const csMax = useMemo(
    () => (csSorted.length === 0 ? 1 : Math.max(...csSorted.map((t) => t.csProb))),
    [csSorted]
  );
  const xgMax = useMemo(
    () => (xgSorted.length === 0 ? 1 : Math.max(...xgSorted.map((t) => t.xG))),
    [xgSorted]
  );

  // ── Shared modal state ─────────────────────────────────
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [profilePlayerId, setProfilePlayerId] = useState<number | null>(null);

  const selectedLineupPlayer = useMemo(() => {
    if (profilePlayerId == null) return undefined;
    for (const team of teams) {
      const player = team.players.find((p) => p.id === profilePlayerId);
      if (player) return player;
    }
    return undefined;
  }, [profilePlayerId, teams]);

  const profileLineupAlerts = selectedLineupPlayer != null
    ? {
        injuryWarning: selectedLineupPlayer.injuryWarning,
        benchRisk: selectedLineupPlayer.benchRisk,
        chanceOfPlaying: selectedLineupPlayer.chanceOfPlaying,
      }
    : undefined;

  const profilePlayerName = useMemo(() => {
    if (profilePlayerId == null) return undefined;
    if (selectedLineupPlayer) return selectedLineupPlayer.webName;
    return poolData?.players.find((p) => p.id === profilePlayerId)?.webName;
  }, [profilePlayerId, selectedLineupPlayer, poolData?.players]);

  const { following, toggle: toggleFollow } = useFollowPlayer(profilePlayerId ?? 0);

  useEffect(() => {
    if (!isPremium) requestUpsell('predictions');
  }, [isPremium, requestUpsell]);

  // ── Points tab data ────────────────────────────────────
  const pointsRows = useMemo(() => {
    const players = poolData?.players ?? [];
    const filtered = players.filter((p) => p.position === posTab);
    return buildPredictedPointsRows(filtered, predictionsData);
  }, [poolData, posTab, predictionsData]);

  const pointsLoading = poolLoading || predictionsLoading;
  const modelReady = predictionsData?.ready === true;
  const showFplFallback =
    !predictionsLoading && nextGw != null && predictionsData != null && !modelReady;

  const nextGwLabel = nextGw !== null ? interpolate(copy.predictionsGwLabel, { n: nextGw }) : '';

  // ── Render ─────────────────────────────────────────────
  return (
    <div className={styles.screen}>
      <ScreenHeader
        backLabel={copy.squadGuestBack}
        title={copy.predictionsTitle}
        right={nextGwLabel ? <span className={styles.gwLabel}>{nextGwLabel}</span> : undefined}
      />

      {/* Main tab bar */}
      <div className={styles.tabs} role="tablist" aria-label={copy.predictionsTitle}>
        {MAIN_TABS.map(({ slug, label }) => (
          <button
            key={slug}
            type="button"
            role="tab"
            aria-selected={activeTab === slug}
            className={`${styles.tab} ${activeTab === slug ? styles.tabActive : ''}`}
            onClick={() => setTab(slug)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Points tab ── */}
      {activeTab === 'points' && (
        <>
          <div className={styles.posTabs} role="tablist" aria-label="Position">
            {POSITION_TABS.map((pos) => (
              <button
                key={pos}
                type="button"
                role="tab"
                aria-selected={posTab === pos}
                className={`${styles.posTab} ${posTab === pos ? styles.posTabActive : ''}`}
                onClick={() => setPosTab(pos)}
              >
                {pos}
              </button>
            ))}
          </div>

          {showFplFallback && (
            <p className={styles.fallbackNotice}>{copy.predictedPointsFplFallback}</p>
          )}

          <div className={styles.listWrap}>
            {pointsLoading && <PointsSkeleton />}

            {!pointsLoading && pointsRows.length === 0 && (
              <p className={styles.empty}>{copy.predictedPointsEmptyPosition}</p>
            )}

            {!pointsLoading && pointsRows.length > 0 && isPremium && (
              <PremiumPointsList rows={pointsRows} onSelect={setProfilePlayerId} />
            )}

            {!pointsLoading && pointsRows.length > 0 && !isPremium && (
              <>
                {pointsRows.slice(0, FREE_VISIBLE).map((row, i) => (
                  <PredictedPointsRow key={row.player.id} rank={i + 1} row={row} onSelect={setProfilePlayerId} />
                ))}
                {pointsRows.slice(FREE_VISIBLE, FREE_TOTAL).length > 0 && (
                  <div className={styles.lockedSection}>
                    {pointsRows.slice(FREE_VISIBLE, FREE_TOTAL).map((row, i) => (
                      <PredictedPointsRow
                        key={row.player.id}
                        rank={FREE_VISIBLE + i + 1}
                        row={row}
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

            {!pointsLoading && pointsRows.length > 0 && modelReady && (
              <p className={styles.disclaimer}>{copy.predictedPointsDisclaimer}</p>
            )}
          </div>
        </>
      )}

      {/* ── Lineups tab ── */}
      {activeTab === 'lineups' && (
        <>
          {!isPremium && (
            <div className={styles.lockedWrap}>
              <PremiumLockedOverlay
                onUnlock={() => setPremiumOpen(true)}
                label={copy.predictionsLineupsUnlockLabel}
              />
            </div>
          )}

          {isPremium && (
            <>
              <TeamPickerGrid
                teams={teams}
                selectedTeamId={resolvedTeamId}
                onSelectTeam={setSelectedTeamId}
                ariaLabel={copy.predictionsTabLineups}
              />

              {activeTeam && (
                <div className={styles.lineupMeta}>
                  <span className={styles.formation}>
                    {copy.predictedLineupsFormationLabel}: {activeTeam.formation.label}
                  </span>
                  {fixtureLabel && <span className={styles.fixture}>{fixtureLabel}</span>}
                </div>
              )}

              <div className={styles.lineupContent}>
                {lineupsQuery.isLoading && (
                  <div className={styles.skeletonBar} aria-busy="true" aria-label={copy.loadingPlaceholder} />
                )}

                {lineupsQuery.isError && (
                  <div>
                    <p className={styles.lineupError}>{copy.predictedLineupsLoadError}</p>
                    <button type="button" className={styles.retryBtn} onClick={() => lineupsQuery.refetch()}>
                      {copy.predictedLineupsRetry}
                    </button>
                  </div>
                )}

                {activeTeam && !lineupsQuery.isLoading && !lineupsQuery.isError && (
                  activeTeam.players.length === 0
                    ? <p className={styles.lineupEmpty}>{copy.predictedLineupsEmptyTeam}</p>
                    : <PredictedLineupPitch
                        players={activeTeam.players}
                        teamShortName={activeTeam.shortName}
                        teamId={activeTeam.teamId}
                        onSelect={setProfilePlayerId}
                      />
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ── CS% tab ── */}
      {activeTab === 'cs' && (
        <div className={styles.marketListWrap}>
          {marketLoading && <MarketSkeleton />}
          {!marketLoading && csSorted.map((team, i) => (
            <MarketTeamRow key={team.teamId} team={team} rank={i + 1} tab="cs" maxValue={csMax} />
          ))}
          {!marketLoading && csSorted.length > 0 && (
            <p className={styles.disclaimer}>{copy.marketDisclaimer}</p>
          )}
        </div>
      )}

      {/* ── xG tab ── */}
      {activeTab === 'xg' && (
        <div className={styles.marketListWrap}>
          {marketLoading && <MarketSkeleton />}
          {!marketLoading && xgSorted.map((team, i) => (
            <MarketTeamRow key={team.teamId} team={team} rank={i + 1} tab="xg" maxValue={xgMax} />
          ))}
          {!marketLoading && xgSorted.length > 0 && (
            <p className={styles.disclaimer}>{copy.marketDisclaimer}</p>
          )}
        </div>
      )}

      {/* ── Shared modals ── */}
      {(activeTab === 'points' || activeTab === 'lineups') && (
        <PremiumSheet
          open={premiumOpen}
          onClose={() => setPremiumOpen(false)}
          title={activeTab === 'lineups' ? copy.predictionsLineupsPremiumTitle : copy.predictedPointsPremiumTitle}
          description={activeTab === 'lineups' ? copy.predictionsLineupsPremiumDescription : copy.predictedPointsPremiumDescription}
          freeLabel={activeTab === 'lineups' ? copy.predictionsLineupsPremiumFreeLabel : copy.predictedPointsPremiumFreeLabel}
          premiumLabel={activeTab === 'lineups' ? copy.predictionsLineupsPremiumPremiumLabel : copy.predictedPointsPremiumPremiumLabel}
        />
      )}

      <PlayerProfileSheet
        playerId={profilePlayerId}
        open={profilePlayerId != null}
        onClose={() => setProfilePlayerId(null)}
        onFollow={() => toggleFollow()}
        isFollowing={following}
        predictionsContext
        lineupAlerts={profileLineupAlerts}
        lineupPlayerName={profilePlayerName}
      />
    </div>
  );
};

PredictionsScreen.displayName = 'PredictionsScreen';
