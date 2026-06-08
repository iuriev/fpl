import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  useGameweeks,
  useMarket,
  useMarketPreview,
  usePlayerPool,
  usePredictedLineups,
  usePredictions,
  usePredictionsPreview,
} from '@/api/queries';
import { MarketTeamPlaceholderRow } from '@/components/ui/MarketTeamPlaceholderRow/MarketTeamPlaceholderRow';
import { MarketTeamRow } from '@/components/ui/MarketTeamRow/MarketTeamRow';
import { PlayerProfileSheet } from '@/components/ui/PlayerProfileSheet/PlayerProfileSheet';
import { PredictedPlayerPlaceholderRow } from '@/components/ui/PredictedPlayerPlaceholderRow/PredictedPlayerPlaceholderRow';
import { PredictedPointsRow } from '@/components/ui/PredictedPointsRow/PredictedPointsRow';
import { PremiumLockedOverlay } from '@/components/ui/PremiumLockedOverlay/PremiumLockedOverlay';
import { PremiumSheet } from '@/components/ui/PremiumSheet/PremiumSheet';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { TeamPickerGrid } from '@/components/ui/TeamPickerGrid/TeamPickerGrid';
import { copy, interpolate } from '@/lib/copy';
import {
  buildPredictedPointsRows,
  buildPreviewPlayerRows,
  type PredictedPointsRowData,
  type PredictionMetric,
} from '@/lib/predicted-points';
import { useStartupReadiness } from '@/lib/startup-readiness/StartupReadinessContext';
import { usePredictionsWarmupRefetch } from '@/lib/startup-readiness/use-predictions-warmup-refetch';
import { isPredictionsWarmupActive } from '@/lib/startup-readiness/warmup-status';
import { useFollowPlayer } from '@/lib/use-follow-player';
import { usePremiumStatus } from '@/lib/use-premium-status';
import { PredictedLineupPitch } from '@/screens/PredictedLineupsScreen/PredictedLineupPitch';
import type { PlayerPosition, TeamMarketDto } from '@/types';

import styles from './PredictionsScreen.module.css';

type MainTab = 'points' | 'lineups' | 'xg' | 'xa' | 'cs' | 'team-xg';
type PositionTab = PlayerPosition;

const MAIN_TABS: { slug: MainTab; label: string }[] = [
  { slug: 'lineups', label: copy.predictionsTabLineups },
  { slug: 'points', label: copy.predictionsTabPoints },
  { slug: 'xg', label: copy.predictionsTabXG },
  { slug: 'xa', label: copy.predictionsTabXA },
  { slug: 'cs', label: copy.predictionsTabCS },
  { slug: 'team-xg', label: copy.predictionsTabTeamXG },
];

const POINTS_POSITION_TABS: PositionTab[] = ['FWD', 'MID', 'DEF', 'GK'];
const ASSIST_POSITION_TABS: PositionTab[] = ['FWD', 'MID', 'DEF'];
const GOALS_POSITION_TABS: PositionTab[] = ['FWD', 'MID', 'DEF'];
const FREE_VISIBLE = 2;
const FREE_TEASER = 8;
const PREMIUM_PAGE_SIZE = 20;

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
      { threshold: 0 },
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

function FreePlayerList({
  rows,
  onSelect,
  onUnlock,
}: {
  rows: PredictedPointsRowData[];
  onSelect: (id: number) => void;
  onUnlock: () => void;
}) {
  if (rows.length === 0) return null;

  return (
    <>
      {rows.slice(0, FREE_VISIBLE).map((row, i) => (
        <PredictedPointsRow key={row.player.id} rank={i + 1} row={row} onSelect={onSelect} />
      ))}
      {FREE_TEASER > 0 && (
        <div className={styles.lockedSection}>
          {Array.from({ length: FREE_TEASER }).map((_, i) => (
            <PredictedPlayerPlaceholderRow key={i} rank={FREE_VISIBLE + i + 1} />
          ))}
          <PremiumLockedOverlay onUnlock={onUnlock} label={copy.predictedPointsUnlockLabel} />
        </div>
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

function FreeMarketList({
  teams,
  tab,
  maxValue,
  onUnlock,
}: {
  teams: TeamMarketDto[];
  tab: 'cs' | 'xg';
  maxValue: number;
  onUnlock: () => void;
}) {
  if (teams.length === 0) return null;

  return (
    <>
      {teams.slice(0, FREE_VISIBLE).map((team, i) => (
        <MarketTeamRow
          key={team.teamId}
          team={team}
          rank={i + 1}
          tab={tab}
          maxValue={maxValue}
        />
      ))}
      <div className={styles.lockedSection}>
        {Array.from({ length: FREE_TEASER }).map((_, i) => (
          <MarketTeamPlaceholderRow key={i} rank={FREE_VISIBLE + i + 1} />
        ))}
        <PremiumLockedOverlay onUnlock={onUnlock} label={copy.predictedPointsUnlockLabel} />
      </div>
    </>
  );
}

export const PredictionsScreen: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isPremium = usePremiumStatus();
  const { health } = useStartupReadiness();
  const predictionsWarmupActive = isPredictionsWarmupActive(health);

  const tabParam = searchParams.get('tab');
  const activeTab: MainTab = (
    ['lineups', 'points', 'xg', 'xa', 'cs', 'team-xg'] as MainTab[]
  ).includes(tabParam as MainTab)
    ? (tabParam as MainTab)
    : 'lineups';

  const setTab = (tab: MainTab) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', tab);
      return p;
    });
  };

  const { data: gameweeksData } = useGameweeks();
  const nextGw = gameweeksData?.next ?? gameweeksData?.current ?? null;

  const [posTab, setPosTab] = useState<PositionTab>('FWD');
  const { data: poolData, isLoading: poolLoading } = usePlayerPool();
  const { data: predictionsData, isLoading: predictionsLoading } = usePredictions(
    nextGw,
    isPremium,
  );
  const { data: predictionsPreview, isLoading: previewLoading } = usePredictionsPreview(
    nextGw,
    !isPremium,
  );

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const lineupsQuery = usePredictedLineups(nextGw, isPremium);

  const { data: marketData, isLoading: marketLoading } = useMarket(nextGw, isPremium);
  const { data: marketPreview, isLoading: marketPreviewLoading } = useMarketPreview(
    nextGw,
    !isPremium,
  );

  usePredictionsWarmupRefetch(nextGw);

  const teams = useMemo(() => lineupsQuery.data?.teams ?? [], [lineupsQuery.data]);
  const defaultTeamId = useMemo(() => {
    if (teams.length === 0) return null;
    const sorted = [...teams].sort((a, b) => a.shortName.localeCompare(b.shortName));
    return sorted[0]?.teamId ?? null;
  }, [teams]);
  const resolvedTeamId = selectedTeamId ?? defaultTeamId;
  const activeTeam = teams.find((t) => t.teamId === resolvedTeamId) ?? teams[0];

  const fixtureLabel =
    activeTeam?.nextFixture != null
      ? interpolate(
          activeTeam.nextFixture.isHome
            ? copy.predictedLineupsVsHome
            : copy.predictedLineupsVsAway,
          { opponent: activeTeam.nextFixture.opponentShortName },
        )
      : null;

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
    [csSorted],
  );
  const xgMax = useMemo(
    () => (xgSorted.length === 0 ? 1 : Math.max(...xgSorted.map((t) => t.xG))),
    [xgSorted],
  );

  const previewCsMax = useMemo(() => {
    const list = marketPreview?.topCs ?? [];
    return list.length === 0 ? 1 : Math.max(...list.map((t) => t.csProb));
  }, [marketPreview]);

  const previewXgMax = useMemo(() => {
    const list = marketPreview?.topXg ?? [];
    return list.length === 0 ? 1 : Math.max(...list.map((t) => t.xG));
  }, [marketPreview]);

  const [premiumOpen, setPremiumOpen] = useState(false);
  const [profilePlayerId, setProfilePlayerId] = useState<number | null>(null);

  useEffect(() => {
    if ((activeTab === 'xa' || activeTab === 'xg') && posTab === 'GK') {
      setPosTab('FWD');
    }
  }, [activeTab, posTab]);

  const selectedLineupPlayer = useMemo(() => {
    if (profilePlayerId == null) return undefined;
    for (const team of teams) {
      const player = team.players.find((p) => p.id === profilePlayerId);
      if (player) return player;
    }
    return undefined;
  }, [profilePlayerId, teams]);

  const profileLineupAlerts =
    selectedLineupPlayer != null
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

  const profileFplCode = useMemo(() => {
    if (profilePlayerId == null) return 0;
    const poolPlayer = poolData?.players.find((p) => p.id === profilePlayerId);
    if (poolPlayer) return poolPlayer.code;
    if (selectedLineupPlayer) return selectedLineupPlayer.fplCode;
    return 0;
  }, [profilePlayerId, poolData?.players, selectedLineupPlayer]);

  const { following, toggle: toggleFollow } = useFollowPlayer(profileFplCode);

  const activeMetric: PredictionMetric =
    activeTab === 'xa' ? 'xAssists' : activeTab === 'xg' ? 'xGoals' : 'xPts';
  const positionTabs =
    activeTab === 'xa'
      ? ASSIST_POSITION_TABS
      : activeTab === 'xg'
        ? GOALS_POSITION_TABS
        : POINTS_POSITION_TABS;

  const playerRows = useMemo(() => {
    const players = poolData?.players ?? [];
    const filtered = players.filter((p) => p.position === posTab);

    if (isPremium) {
      return buildPredictedPointsRows(filtered, predictionsData, activeMetric);
    }

    if (activeTab === 'xa') {
      return buildPreviewPlayerRows(filtered, predictionsPreview, posTab, 'xAssists');
    }

    if (activeTab === 'xg') {
      return buildPreviewPlayerRows(filtered, predictionsPreview, posTab, 'xGoals');
    }

    if (predictionsPreview?.ready) {
      return buildPreviewPlayerRows(filtered, predictionsPreview, posTab, 'xPts');
    }

    return buildPredictedPointsRows(filtered, undefined, 'xPts');
  }, [
    poolData,
    posTab,
    predictionsData,
    predictionsPreview,
    isPremium,
    activeTab,
    activeMetric,
  ]);

  const playerListLoading = poolLoading || (isPremium ? predictionsLoading : previewLoading);
  const modelReady = isPremium
    ? predictionsData?.ready === true
    : activeTab === 'xa' || activeTab === 'xg'
      ? predictionsPreview?.ready === true
      : predictionsPreview?.ready === true || predictionsData?.ready === true;

  const showFplFallback =
    !isPremium &&
    activeTab === 'points' &&
    !previewLoading &&
    nextGw != null &&
    predictionsPreview != null &&
    !predictionsPreview.ready;

  const showAssistsPending =
    !isPremium &&
    activeTab === 'xa' &&
    !previewLoading &&
    predictionsPreview != null &&
    !predictionsPreview.ready;

  const showGoalsPending =
    !isPremium &&
    activeTab === 'xg' &&
    !previewLoading &&
    predictionsPreview != null &&
    !predictionsPreview.ready;

  const emptyCopy =
    activeTab === 'xa'
      ? copy.predictedAssistsEmptyPosition
      : activeTab === 'xg'
        ? copy.predictedGoalsEmptyPosition
        : copy.predictedPointsEmptyPosition;

  const disclaimerCopy =
    activeTab === 'xa'
      ? copy.predictedAssistsDisclaimer
      : activeTab === 'xg'
        ? copy.predictedGoalsDisclaimer
        : copy.predictedPointsDisclaimer;

  const nextGwLabel = nextGw !== null ? interpolate(copy.predictionsGwLabel, { n: nextGw }) : '';

  const marketListLoading = isPremium ? marketLoading : marketPreviewLoading;

  const csMarketTeams = isPremium ? csSorted : (marketPreview?.topCs ?? []);
  const xgMarketTeams = isPremium ? xgSorted : (marketPreview?.topXg ?? []);

  const showCsMarketLoading =
    marketListLoading || (predictionsWarmupActive && csMarketTeams.length === 0);
  const showXgMarketLoading =
    marketListLoading || (predictionsWarmupActive && xgMarketTeams.length === 0);

  const showCsMarketEmpty =
    !showCsMarketLoading && csMarketTeams.length === 0 && !predictionsWarmupActive;
  const showXgMarketEmpty =
    !showXgMarketLoading && xgMarketTeams.length === 0 && !predictionsWarmupActive;

  const marketEmptyMessage =
    nextGw !== null
      ? interpolate(copy.marketEmptyState, { n: nextGw })
      : copy.marketEmptyState.replace(' GW {n}', '');

  const marketCalculatingMessage =
    nextGw !== null
      ? interpolate(copy.marketCalculatingState, { n: nextGw })
      : copy.marketCalculatingState.replace(' GW {n}', '');

  return (
    <div className={styles.screen}>
      <ScreenHeader
        backLabel={copy.squadGuestBack}
        title={copy.predictionsTitle}
        right={nextGwLabel ? <span className={styles.gwLabel}>{nextGwLabel}</span> : undefined}
      />

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

      {(activeTab === 'points' || activeTab === 'xg' || activeTab === 'xa') && (
        <>
          <div className={styles.posTabs} role="tablist" aria-label="Position">
            {positionTabs.map((pos) => (
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

          {showGoalsPending && (
            <p className={styles.fallbackNotice}>{copy.predictedGoalsModelPending}</p>
          )}

          {showAssistsPending && (
            <p className={styles.fallbackNotice}>{copy.predictedAssistsModelPending}</p>
          )}

          <div className={styles.listWrap}>
            {playerListLoading && <PointsSkeleton />}

            {!playerListLoading && playerRows.length === 0 && (
              <p className={styles.empty}>{emptyCopy}</p>
            )}

            {!playerListLoading && playerRows.length > 0 && isPremium && (
              <PremiumPointsList rows={playerRows} onSelect={setProfilePlayerId} />
            )}

            {!playerListLoading && playerRows.length > 0 && !isPremium && (
              <FreePlayerList
                rows={playerRows}
                onSelect={setProfilePlayerId}
                onUnlock={() => setPremiumOpen(true)}
              />
            )}

            {!playerListLoading && playerRows.length > 0 && modelReady && (
              <p className={styles.disclaimer}>{disclaimerCopy}</p>
            )}
          </div>
        </>
      )}

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
                  <div
                    className={styles.skeletonBar}
                    aria-busy="true"
                    aria-label={copy.loadingPlaceholder}
                  />
                )}

                {lineupsQuery.isError && (
                  <div>
                    <p className={styles.lineupError}>{copy.predictedLineupsLoadError}</p>
                    <button
                      type="button"
                      className={styles.retryBtn}
                      onClick={() => lineupsQuery.refetch()}
                    >
                      {copy.predictedLineupsRetry}
                    </button>
                  </div>
                )}

                {activeTeam && !lineupsQuery.isLoading && !lineupsQuery.isError &&
                  (activeTeam.players.length === 0 ? (
                    <p className={styles.lineupEmpty}>{copy.predictedLineupsEmptyTeam}</p>
                  ) : (
                    <PredictedLineupPitch
                      players={activeTeam.players}
                      teamShortName={activeTeam.shortName}
                      teamId={activeTeam.teamId}
                      onSelect={setProfilePlayerId}
                    />
                  ))}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'cs' && (
        <div className={styles.marketListWrap}>
          {showCsMarketLoading && <MarketSkeleton />}
          {showCsMarketLoading && predictionsWarmupActive && (
            <p className={styles.calculating}>{marketCalculatingMessage}</p>
          )}
          {showCsMarketEmpty && <p className={styles.empty}>{marketEmptyMessage}</p>}
          {!showCsMarketLoading && isPremium &&
            csSorted.map((team, i) => (
              <MarketTeamRow
                key={team.teamId}
                team={team}
                rank={i + 1}
                tab="cs"
                maxValue={csMax}
              />
            ))}
          {!showCsMarketLoading && !isPremium && (
            <FreeMarketList
              teams={marketPreview?.topCs ?? []}
              tab="cs"
              maxValue={previewCsMax}
              onUnlock={() => setPremiumOpen(true)}
            />
          )}
          {!showCsMarketLoading && isPremium && csSorted.length > 0 && (
            <p className={styles.disclaimer}>{copy.marketDisclaimer}</p>
          )}
        </div>
      )}

      {activeTab === 'team-xg' && (
        <div className={styles.marketListWrap}>
          {showXgMarketLoading && <MarketSkeleton />}
          {showXgMarketLoading && predictionsWarmupActive && (
            <p className={styles.calculating}>{marketCalculatingMessage}</p>
          )}
          {showXgMarketEmpty && <p className={styles.empty}>{marketEmptyMessage}</p>}
          {!showXgMarketLoading && isPremium &&
            xgSorted.map((team, i) => (
              <MarketTeamRow
                key={team.teamId}
                team={team}
                rank={i + 1}
                tab="xg"
                maxValue={xgMax}
              />
            ))}
          {!showXgMarketLoading && !isPremium && (
            <FreeMarketList
              teams={marketPreview?.topXg ?? []}
              tab="xg"
              maxValue={previewXgMax}
              onUnlock={() => setPremiumOpen(true)}
            />
          )}
          {!showXgMarketLoading && isPremium && xgSorted.length > 0 && (
            <p className={styles.disclaimer}>{copy.marketDisclaimer}</p>
          )}
        </div>
      )}

      {(activeTab === 'points' ||
        activeTab === 'xg' ||
        activeTab === 'xa' ||
        activeTab === 'lineups' ||
        activeTab === 'cs' ||
        activeTab === 'team-xg') && (
        <PremiumSheet
          open={premiumOpen}
          onClose={() => setPremiumOpen(false)}
          title={
            activeTab === 'lineups'
              ? copy.predictionsLineupsPremiumTitle
              : copy.predictedPointsPremiumTitle
          }
          description={
            activeTab === 'lineups'
              ? copy.predictionsLineupsPremiumDescription
              : copy.predictedPointsPremiumDescription
          }
          freeLabel={
            activeTab === 'lineups'
              ? copy.predictionsLineupsPremiumFreeLabel
              : copy.predictedPointsPremiumFreeLabel
          }
          premiumLabel={
            activeTab === 'lineups'
              ? copy.predictionsLineupsPremiumPremiumLabel
              : copy.predictedPointsPremiumPremiumLabel
          }
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
