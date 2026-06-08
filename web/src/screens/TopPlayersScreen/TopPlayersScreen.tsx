import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useSearchParams } from 'react-router-dom';

import { ApiError } from '@/api/client';
import {
  useGameweeks,
  useLeaderboardGw,
  useLeaderboardSeason,
  useTeamOfTheWeek,
  useTeamPlayers,
  useTeams,
  useTopPlayersGw,
  useTopPlayersSeason,
} from '@/api/queries';
import { BottomSheet } from '@/components/ui/BottomSheet/BottomSheet';
import { BpsRankRow } from '@/components/ui/BpsRankRow/BpsRankRow';
import { Button } from '@/components/ui/Button/Button';
import { Pitch } from '@/components/ui/Pitch/Pitch';
import { PlayerCard } from '@/components/ui/PlayerCard/PlayerCard';
import { PlayerRankRow } from '@/components/ui/PlayerRankRow/PlayerRankRow';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { type ViewMode, ViewToggle } from '@/components/ui/ViewToggle/ViewToggle';
import { copy } from '@/lib/copy';
import { useFollowPlayer } from '@/lib/use-follow-player';
import type {
  LeaderboardPlayer,
  PlayerPosition,
  PlayerStatus,
  SquadPlayer,
  TeamOfTheWeekPlayer,
  TopPlayersPlayer,
} from '@/types';
import { MAX_GAMEWEEK } from '@/types';

import styles from './TopPlayersScreen.module.css';

type Tab = 'points' | 'defcon' | 'bps' | 'team' | 'season';
type SeasonView = 'points' | 'defcon' | 'bps';

const PAGE_SIZE = 20;
const EMPTY_TOP: TopPlayersPlayer[] = [];
const EMPTY_LB: LeaderboardPlayer[] = [];
const POSITION_ORDER: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];

function withTransition(update: () => void): void {
  if (!document.startViewTransition) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}

function useProgressiveList<T>(items: T[]) {
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
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, items.length));
        }
      },
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items, visibleCount, items.length]);

  return {
    visible: items.slice(0, visibleCount),
    sentinelRef,
    hasMore: visibleCount < items.length,
  };
}

function toSquadPlayer(p: TeamOfTheWeekPlayer): SquadPlayer {
  return {
    id: p.id,
    name: p.webName,
    position: p.position,
    club: p.teamShortName,
    teamCode: p.teamCode,
    teamId: p.teamCode,
    nowCost: 0,
    points: p.points,
    isCaptain: false,
    isViceCaptain: false,
    status: 'a' as PlayerStatus,
    chanceOfPlaying: null,
    news: undefined,
    stats: {
      total_points: p.points,
      minutes: 0,
      goals_scored: 0,
      assists: 0,
      clean_sheets: 0,
      goals_conceded: 0,
      own_goals: 0,
      penalties_saved: 0,
      penalties_missed: 0,
      yellow_cards: 0,
      red_cards: 0,
      saves: 0,
      bonus: 0,
    },
  };
}

function groupByPosition(
  players: TeamOfTheWeekPlayer[]
): Record<PlayerPosition, TeamOfTheWeekPlayer[]> {
  const groups: Record<PlayerPosition, TeamOfTheWeekPlayer[]> = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  };
  for (const p of players) {
    groups[p.position].push(p);
  }
  return groups;
}

export const TopPlayersScreen: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: gameweeksData } = useGameweeks();

  const finishedGws = useMemo(
    () => gameweeksData?.gameweeks.filter((gw) => gw.finished) ?? [],
    [gameweeksData]
  );
  const latestFinishedGw = finishedGws.length > 0 ? finishedGws[finishedGws.length - 1].id : null;

  const tabParam = searchParams.get('tab');
  const activeTab: Tab =
    tabParam === 'defcon'
      ? 'defcon'
      : tabParam === 'bps'
        ? 'bps'
        : tabParam === 'team'
          ? 'team'
          : tabParam === 'season'
            ? 'season'
            : 'points';

  const seasonViewParam = searchParams.get('seasonView');
  const activeSeasonView: SeasonView =
    seasonViewParam === 'defcon' ? 'defcon' : seasonViewParam === 'bps' ? 'bps' : 'points';

  const gwParam = searchParams.get('gw');
  const selectedGw = useMemo(() => {
    if (gwParam) {
      const n = Number(gwParam);
      if (Number.isInteger(n) && n >= 1 && n <= MAX_GAMEWEEK) return n;
    }
    return latestFinishedGw;
  }, [gwParam, latestFinishedGw]);

  const selectedGwFinished = useMemo(
    () => finishedGws.some((gw) => gw.id === selectedGw),
    [finishedGws, selectedGw]
  );

  // View mode (List / Pitch) for Points tab — local state, not persisted in URL
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const prevTab = useRef<Tab>(activeTab);
  if (prevTab.current !== activeTab) {
    prevTab.current = activeTab;
    if (activeTab !== 'points') setViewMode('list');
  }

  // Teams query — loaded when "By Team" tab is active
  const { data: teamsData } = useTeams();
  const teams = useMemo(() => teamsData?.teams ?? [], [teamsData]);

  const teamFilterParam = searchParams.get('teamFilter');
  const selectedTeamCode = useMemo(() => {
    if (teamFilterParam) {
      const code = Number(teamFilterParam);
      if (!isNaN(code) && teams.some((t) => t.code === code)) return code;
    }
    return teams.length > 0 ? teams[0].code : null;
  }, [teamFilterParam, teams]);

  const selectedTeamName = teams.find((t) => t.code === selectedTeamCode)?.name ?? '';
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);

  const showGwNav = activeTab === 'points' || activeTab === 'defcon' || activeTab === 'bps';

  const canGoPrev =
    selectedGw !== null && selectedGw > 1 && finishedGws.some((gw) => gw.id === selectedGw - 1);
  const canGoNext =
    selectedGw !== null &&
    latestFinishedGw !== null &&
    selectedGw < latestFinishedGw &&
    finishedGws.some((gw) => gw.id === selectedGw + 1);

  const navigateGw = (delta: number) => {
    if (selectedGw === null) return;
    const next = selectedGw + delta;
    withTransition(() =>
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set('gw', String(next));
        return p;
      })
    );
  };

  const setTab = (tab: Tab) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', tab);
      return p;
    });
  };

  const setSeasonView = (view: SeasonView) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('seasonView', view);
      return p;
    });
  };

  const handleTeamChange = (code: number) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('teamFilter', String(code));
      return p;
    });
  };

  // Queries
  const gwQuery = useTopPlayersGw(activeTab === 'points' && selectedGwFinished ? selectedGw : null);
  const seasonQuery = useTopPlayersSeason();
  const teamPlayersQuery = useTeamPlayers(activeTab === 'team' ? selectedTeamCode : null);
  const totwQuery = useTeamOfTheWeek(
    activeTab === 'points' && viewMode === 'pitch' && selectedGwFinished ? selectedGw : null
  );
  const leaderboardGwQuery = useLeaderboardGw(
    (activeTab === 'defcon' || activeTab === 'bps') && selectedGwFinished ? selectedGw : null
  );
  const leaderboardSeasonQuery = useLeaderboardSeason();

  const gwPlayers = gwQuery.data?.players ?? EMPTY_TOP;
  const seasonPlayers = seasonQuery.data?.players ?? EMPTY_TOP;
  const teamPlayers = teamPlayersQuery.data?.players ?? EMPTY_TOP;

  const defconPlayers = leaderboardGwQuery.data?.defcon ?? EMPTY_LB;
  const bpsPlayers = leaderboardGwQuery.data?.bps ?? EMPTY_LB;
  const seasonDefconPlayers = leaderboardSeasonQuery.data?.defcon ?? EMPTY_LB;
  const seasonBpsPlayers = leaderboardSeasonQuery.data?.bps ?? EMPTY_LB;

  const activePlayers =
    activeTab === 'points' ? gwPlayers : activeTab === 'team' ? teamPlayers : EMPTY_TOP;

  const { visible, sentinelRef, hasMore } = useProgressiveList(activePlayers);
  const defcon = useProgressiveList(defconPlayers);
  const bps = useProgressiveList(bpsPlayers);
  const seasonDefcon = useProgressiveList(seasonDefconPlayers);
  const seasonBps = useProgressiveList(seasonBpsPlayers);
  const seasonPoints = useProgressiveList(seasonPlayers);

  const gwLabel = selectedGw !== null ? `GW ${selectedGw}` : '';

  const isLoading =
    activeTab === 'points'
      ? gwQuery.isLoading
      : activeTab === 'team'
        ? teamPlayersQuery.isLoading
        : false;

  const isError =
    activeTab === 'points'
      ? gwQuery.isError
      : activeTab === 'team'
        ? teamPlayersQuery.isError
        : false;

  const refetch =
    activeTab === 'points'
      ? gwQuery.refetch
      : activeTab === 'team'
        ? teamPlayersQuery.refetch
        : gwQuery.refetch;

  // TOTW state
  const isTotwGwTransition =
    totwQuery.isFetching && totwQuery.isPlaceholderData && !!totwQuery.data;
  const showTotwInitialSkeleton = totwQuery.isPending && !totwQuery.data;
  const isTotwNotAvailable = !selectedGwFinished && selectedGw !== null;
  const isTotwIs400 =
    totwQuery.isError && totwQuery.error instanceof ApiError && totwQuery.error.status === 400;
  const isTotwRealError = totwQuery.isError && !isTotwIs400;
  const showPitch =
    activeTab === 'points' &&
    viewMode === 'pitch' &&
    selectedGwFinished &&
    !isTotwRealError &&
    !isTotwNotAvailable &&
    !isTotwIs400;

  const totwPositionGroups = useMemo(() => {
    if (!totwQuery.data) return null;
    return groupByPosition(totwQuery.data.players);
  }, [totwQuery.data]);

  return (
    <div className={`${styles.screen} ${showPitch ? styles.screenTotw : ''}`}>
      <ScreenHeader title={copy.topPlayersTitle} />

      <div className={styles.tabs} role="tablist" aria-label={copy.topPlayersTitle}>
        <button
          role="tab"
          aria-selected={activeTab === 'points'}
          className={`${styles.tab} ${activeTab === 'points' ? styles.tabActive : ''}`}
          onClick={() => setTab('points')}
        >
          {copy.topPlayersTabPoints}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'defcon'}
          className={`${styles.tab} ${activeTab === 'defcon' ? styles.tabActive : ''}`}
          onClick={() => setTab('defcon')}
        >
          {copy.topPlayersTabDefcon}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'bps'}
          className={`${styles.tab} ${activeTab === 'bps' ? styles.tabActive : ''}`}
          onClick={() => setTab('bps')}
        >
          {copy.topPlayersTabBps}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'team'}
          className={`${styles.tab} ${activeTab === 'team' ? styles.tabActive : ''}`}
          onClick={() => setTab('team')}
        >
          {copy.topPlayersTabTeam}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'season'}
          className={`${styles.tab} ${activeTab === 'season' ? styles.tabActive : ''}`}
          onClick={() => setTab('season')}
        >
          {copy.topPlayersTabSeason}
        </button>
      </div>

      {showGwNav && (
        <div className={styles.gwNav}>
          <button
            className={styles.navBtn}
            onClick={() => navigateGw(-1)}
            disabled={!canGoPrev}
            aria-label="Previous gameweek"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M10 4l-4 4 4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className={styles.gwLabel}>{gwLabel}</span>
          <button
            className={styles.navBtn}
            onClick={() => navigateGw(1)}
            disabled={!canGoNext}
            aria-label="Next gameweek"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={styles.chevronRight}>
              <path
                d="M10 4l-4 4 4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {activeTab === 'points' && (
        <div className={styles.viewToggleWrap}>
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </div>
      )}

      {activeTab === 'team' && teams.length > 0 && (
        <>
          <div className={styles.teamNav}>
            <span className={styles.teamSelectLabel}>{copy.topPlayersTeamSelectLabel}</span>
            <button
              className={styles.teamPickerTrigger}
              aria-label={copy.topPlayersTeamSelectLabel}
              aria-haspopup="listbox"
              aria-expanded={teamPickerOpen}
              onClick={() => setTeamPickerOpen(true)}
            >
              <span className={styles.teamPickerValue}>{selectedTeamName}</span>
              <svg
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className={styles.teamPickerChevron}
              >
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <BottomSheet
            open={teamPickerOpen}
            onClose={() => setTeamPickerOpen(false)}
            title={copy.topPlayersTeamSelectLabel}
          >
            <div className={styles.teamList}>
              {teams.map((team) => (
                <button
                  key={team.code}
                  className={`${styles.teamOption} ${team.code === selectedTeamCode ? styles.teamOptionSelected : ''}`}
                  aria-pressed={team.code === selectedTeamCode}
                  onClick={() => {
                    handleTeamChange(team.code);
                    setTeamPickerOpen(false);
                  }}
                >
                  <span className={styles.teamOptionName}>{team.name}</span>
                  {team.code === selectedTeamCode && (
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                      className={styles.teamOptionCheck}
                    >
                      <path
                        d="M3 8l4 4 6-7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </BottomSheet>
        </>
      )}

      {/* Points tab — List view */}
      {activeTab === 'points' && viewMode === 'list' && (
        <div className={styles.body}>
          {isLoading && <PlayerListSkeleton />}

          {isError && (
            <div className={styles.stateCenter}>
              <p className={styles.stateText}>{copy.topPlayersLoadError}</p>
              <Button variant="secondary" onClick={() => refetch()}>
                {copy.topPlayersRetry}
              </Button>
            </div>
          )}

          {!isLoading && !isError && activePlayers.length > 0 && (
            <div className={styles.list}>
              {visible.map((player, i) => (
                <FollowableRankRow key={player.id} rank={i + 1} player={player} />
              ))}
              {hasMore && <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />}
            </div>
          )}
        </div>
      )}

      {/* Points tab — Pitch view (TOTW) */}
      {activeTab === 'points' && viewMode === 'pitch' && isTotwRealError && (
        <div className={styles.stateCenter}>
          <p className={styles.stateText}>{copy.teamOfTheWeekLoadError}</p>
          <Button variant="secondary" onClick={() => totwQuery.refetch()}>
            {copy.teamOfTheWeekRetry}
          </Button>
        </div>
      )}

      {activeTab === 'points' && viewMode === 'pitch' && (isTotwNotAvailable || isTotwIs400) && (
        <div className={styles.stateCenter}>
          <p className={styles.stateText}>{copy.teamOfTheWeekNotAvailable}</p>
        </div>
      )}

      {showPitch && (
        <div
          className={`${styles.pitchWrap} ${isTotwGwTransition ? styles.pitchWrap_fetching : ''}`}
          aria-busy={showTotwInitialSkeleton || isTotwGwTransition}
          aria-label={showTotwInitialSkeleton ? copy.loadingPlaceholder : undefined}
        >
          <Pitch className={styles.pitchFill} preserveAspectRatio="none">
            {showTotwInitialSkeleton ? (
              <PitchSkeletonContent />
            ) : (
              totwQuery.data &&
              totwPositionGroups && (
                <div className={styles.pitchRows}>
                  {POSITION_ORDER.map((pos) => (
                    <div key={pos} className={styles.playerRow}>
                      {totwPositionGroups[pos].map((player) => (
                        <PlayerCard key={player.id} player={toSquadPlayer(player)} size="large" />
                      ))}
                    </div>
                  ))}
                </div>
              )
            )}
          </Pitch>
        </div>
      )}

      {/* By Team tab */}
      {activeTab === 'team' && (
        <div className={styles.body}>
          {teamPlayersQuery.isLoading && <PlayerListSkeleton />}

          {teamPlayersQuery.isError && (
            <div className={styles.stateCenter}>
              <p className={styles.stateText}>{copy.topPlayersTeamLoadError}</p>
              <Button variant="secondary" onClick={() => teamPlayersQuery.refetch()}>
                {copy.topPlayersRetry}
              </Button>
            </div>
          )}

          {!teamPlayersQuery.isLoading && !teamPlayersQuery.isError && teamPlayers.length > 0 && (
            <div className={styles.list}>
              {visible.map((player, i) => (
                <FollowableRankRow key={player.id} rank={i + 1} player={player} />
              ))}
              {hasMore && <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />}
            </div>
          )}
        </div>
      )}

      {/* DEFCON tab */}
      {activeTab === 'defcon' && (
        <div className={styles.body}>
          {leaderboardGwQuery.isLoading && <PlayerListSkeleton />}
          {leaderboardGwQuery.isError && (
            <div className={styles.stateCenter}>
              <p className={styles.stateText}>{copy.topPlayersLoadError}</p>
              <Button variant="secondary" onClick={() => leaderboardGwQuery.refetch()}>
                {copy.topPlayersRetry}
              </Button>
            </div>
          )}
          {!leaderboardGwQuery.isLoading && !leaderboardGwQuery.isError && (
            <div className={styles.list}>
              {defcon.visible.map((player, i) => (
                <BpsRankRow key={player.id} rank={i + 1} player={player} variant="defcon" />
              ))}
              {defcon.hasMore && (
                <div ref={defcon.sentinelRef} className={styles.sentinel} aria-hidden="true" />
              )}
            </div>
          )}
        </div>
      )}

      {/* BPS tab */}
      {activeTab === 'bps' && (
        <div className={styles.body}>
          {leaderboardGwQuery.isLoading && <PlayerListSkeleton />}
          {leaderboardGwQuery.isError && (
            <div className={styles.stateCenter}>
              <p className={styles.stateText}>{copy.topPlayersLoadError}</p>
              <Button variant="secondary" onClick={() => leaderboardGwQuery.refetch()}>
                {copy.topPlayersRetry}
              </Button>
            </div>
          )}
          {!leaderboardGwQuery.isLoading && !leaderboardGwQuery.isError && (
            <div className={styles.list}>
              {bps.visible.map((player, i) => (
                <BpsRankRow key={player.id} rank={i + 1} player={player} variant="bps" />
              ))}
              {bps.hasMore && (
                <div ref={bps.sentinelRef} className={styles.sentinel} aria-hidden="true" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Season tab */}
      {activeTab === 'season' && (
        <div className={styles.body}>
          <div className={styles.seasonSubToggle} role="group" aria-label="Season view">
            <button
              className={`${styles.seasonPill} ${activeSeasonView === 'points' ? styles.seasonPillActive : ''}`}
              aria-pressed={activeSeasonView === 'points'}
              onClick={() => setSeasonView('points')}
            >
              {copy.topPlayersSeasonSubPoints}
            </button>
            <button
              className={`${styles.seasonPill} ${activeSeasonView === 'defcon' ? styles.seasonPillActive : ''}`}
              aria-pressed={activeSeasonView === 'defcon'}
              onClick={() => setSeasonView('defcon')}
            >
              {copy.topPlayersSeasonSubDefcon}
            </button>
            <button
              className={`${styles.seasonPill} ${activeSeasonView === 'bps' ? styles.seasonPillActive : ''}`}
              aria-pressed={activeSeasonView === 'bps'}
              onClick={() => setSeasonView('bps')}
            >
              {copy.topPlayersSeasonSubBps}
            </button>
          </div>

          {activeSeasonView === 'points' && (
            <>
              {seasonQuery.isLoading && <PlayerListSkeleton />}
              {seasonQuery.isError && (
                <div className={styles.stateCenter}>
                  <p className={styles.stateText}>{copy.topPlayersLoadError}</p>
                  <Button variant="secondary" onClick={() => seasonQuery.refetch()}>
                    {copy.topPlayersRetry}
                  </Button>
                </div>
              )}
              {!seasonQuery.isLoading && !seasonQuery.isError && seasonPoints.visible.length > 0 && (
                <div className={styles.list}>
                  {seasonPoints.visible.map((player, i) => (
                    <FollowableRankRow key={player.id} rank={i + 1} player={player} />
                  ))}
                  {seasonPoints.hasMore && (
                    <div ref={seasonPoints.sentinelRef} className={styles.sentinel} aria-hidden="true" />
                  )}
                </div>
              )}
            </>
          )}

          {activeSeasonView === 'defcon' && (
            <>
              {leaderboardSeasonQuery.isLoading && <PlayerListSkeleton />}
              {leaderboardSeasonQuery.isError && (
                <div className={styles.stateCenter}>
                  <p className={styles.stateText}>{copy.topPlayersLoadError}</p>
                  <Button variant="secondary" onClick={() => leaderboardSeasonQuery.refetch()}>
                    {copy.topPlayersRetry}
                  </Button>
                </div>
              )}
              {!leaderboardSeasonQuery.isLoading && !leaderboardSeasonQuery.isError && (
                <div className={styles.list}>
                  {seasonDefcon.visible.map((player, i) => (
                    <BpsRankRow key={player.id} rank={i + 1} player={player} variant="defcon" />
                  ))}
                  {seasonDefcon.hasMore && (
                    <div ref={seasonDefcon.sentinelRef} className={styles.sentinel} aria-hidden="true" />
                  )}
                </div>
              )}
            </>
          )}

          {activeSeasonView === 'bps' && (
            <>
              {leaderboardSeasonQuery.isLoading && <PlayerListSkeleton />}
              {leaderboardSeasonQuery.isError && (
                <div className={styles.stateCenter}>
                  <p className={styles.stateText}>{copy.topPlayersLoadError}</p>
                  <Button variant="secondary" onClick={() => leaderboardSeasonQuery.refetch()}>
                    {copy.topPlayersRetry}
                  </Button>
                </div>
              )}
              {!leaderboardSeasonQuery.isLoading && !leaderboardSeasonQuery.isError && (
                <div className={styles.list}>
                  {seasonBps.visible.map((player, i) => (
                    <BpsRankRow key={player.id} rank={i + 1} player={player} variant="bps" />
                  ))}
                  {seasonBps.hasMore && (
                    <div ref={seasonBps.sentinelRef} className={styles.sentinel} aria-hidden="true" />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

TopPlayersScreen.displayName = 'TopPlayersScreen';

function FollowableRankRow({
  rank,
  player,
}: {
  rank: number;
  player: import('@/types').TopPlayersPlayer;
}) {
  const { following, toggle } = useFollowPlayer(player.id);
  return (
    <PlayerRankRow
      rank={rank}
      player={player}
      onFollow={() => toggle()}
      isFollowing={following}
    />
  );
}

function PlayerListSkeleton() {
  return (
    <div className={styles.list} aria-label={copy.loadingPlaceholder} aria-busy="true">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <div className={`${styles.skeletonCell} ${styles.skeletonRank}`} />
          <div className={`${styles.skeletonCell} ${styles.skeletonJersey}`} />
          <div className={styles.skeletonInfo}>
            <div className={`${styles.skeletonCell} ${styles.skeletonName}`} />
            <div className={`${styles.skeletonCell} ${styles.skeletonMeta}`} />
          </div>
          <div className={`${styles.skeletonCell} ${styles.skeletonPoints}`} />
        </div>
      ))}
    </div>
  );
}

function PitchSkeletonContent() {
  return (
    <>
      <div className={styles.pitchSkeletonVeil} />
      <div className={styles.pitchRows}>
        {[1, 3, 4, 3].map((count, rowIdx) => (
          <div key={rowIdx} className={styles.playerRow}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className={styles.pitchSkeletonPlayer}>
                <div className={styles.pitchSkeletonJersey} />
                <div className={styles.pitchSkeletonNameBar} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
