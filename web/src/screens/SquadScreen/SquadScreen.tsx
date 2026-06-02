import React, { useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { ApiError } from '@/api/client';
import { useEntry, useGameweeks, usePlayerPool, useSquad } from '@/api/queries';
import { Button } from '@/components/ui/Button/Button';
import { Drawer } from '@/components/ui/Drawer/Drawer';
import { ListView, ListViewSkeleton } from '@/components/ui/ListView/ListView';
import { Pitch } from '@/components/ui/Pitch/Pitch';
import { PlayerCard } from '@/components/ui/PlayerCard/PlayerCard';
import { SummaryStrip } from '@/components/ui/SummaryStrip/SummaryStrip';
import type { NavLinksMode } from '@/components/ui/TeamInfoPanel/TeamInfoPanel';
import { TeamInfoPanel, TeamInfoPanelSkeleton } from '@/components/ui/TeamInfoPanel/TeamInfoPanel';
import { type ViewMode, ViewToggle } from '@/components/ui/ViewToggle/ViewToggle';
import { copy, interpolate } from '@/lib/copy';
import { useMyTeam } from '@/lib/my-team/MyTeamContext';
import { useFollowPlayer } from '@/lib/use-follow-player';
import { useFollowTeam } from '@/lib/use-follow-team';
import type { PlayerPosition, SquadPlayer } from '@/types';
import { MAX_GAMEWEEK } from '@/types';

import styles from './SquadScreen.module.css';

export interface SquadScreenProps {
  teamId: number;
  isGuest?: boolean;
}

const POSITION_ORDER: PlayerPosition[] = ['FWD', 'MID', 'DEF', 'GK'];

function withTransition(update: () => void): void {
  if (!document.startViewTransition) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}

function groupByPosition(players: SquadPlayer[]): Record<PlayerPosition, SquadPlayer[]> {
  const groups: Record<PlayerPosition, SquadPlayer[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of players) {
    groups[p.position].push(p);
  }
  return groups;
}

function benchLabel(index: number, position: PlayerPosition): string {
  return position === 'GK' ? 'GKP' : `${index}. ${position}`;
}

export const SquadScreen: React.FC<SquadScreenProps> = ({ teamId, isGuest }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDemoMode } = useMyTeam();
  const isGuestMode = isGuest ?? false;

  const navLinksMode: NavLinksMode = isDemoMode ? 'demo' : isGuestMode ? 'hidden' : 'full';
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/';

  const { following: followingTeam, limitReached: followLimitReached, toggle: toggleFollowTeam } = useFollowTeam(teamId, isGuestMode);

  const { data: gameweeksData } = useGameweeks();
  const { data: entry, isError: entryIsError } = useEntry(teamId);

  const currentGw = gameweeksData?.current ?? null;
  const maxGw = currentGw !== null ? Math.min(currentGw + 1, MAX_GAMEWEEK) : null;

  const gwParam = searchParams.get('gw');
  const selectedGw = useMemo(() => {
    if (gwParam) {
      const n = Number(gwParam);
      if (Number.isInteger(n) && n >= 1 && n <= MAX_GAMEWEEK) return n;
    }
    return currentGw;
  }, [gwParam, currentGw]);

  const viewParam = searchParams.get('view');
  const view: ViewMode = viewParam === 'list' ? 'list' : 'pitch';

  const {
    data: squad,
    isLoading,
    isError: squadIsError,
    error: squadError,
    refetch,
  } = useSquad(entryIsError ? null : teamId, selectedGw);

  const { data: poolData } = usePlayerPool();

  const isNextGw = currentGw !== null && selectedGw !== null && selectedGw === currentGw + 1;

  const poolLookup = useMemo(() => {
    if (!poolData) return null;
    return new Map(poolData.players.map((p) => [p.id, p]));
  }, [poolData]);

  const isNoSquad = squadIsError && squadError instanceof ApiError && squadError.status === 404;
  const isSquadError = squadIsError && !isNoSquad;

  const jumpToCurrent = () => {
    if (currentGw === null) return;
    withTransition(() =>
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set('gw', String(currentGw));
        return p;
      })
    );
  };

  const canGoPrev = selectedGw !== null && selectedGw > 1;
  const canGoNext = selectedGw !== null && maxGw !== null && selectedGw < maxGw;

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

  const handleViewChange = (mode: ViewMode) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('view', mode);
      return p;
    });
  };

  const handleChangeTeam = () => {
    if (isDemoMode) {
      navigate('/entry', { state: { demo: true } });
    } else {
      navigate('/entry');
    }
  };

  const positionGroups = useMemo(() => {
    if (!squad) return null;
    return groupByPosition(squad.starters);
  }, [squad]);

  const gwLabel =
    selectedGw !== null ? `${copy.squadGameweekLabel} ${selectedGw}` : copy.squadGameweekLabel;

  const drawerHeader = entry ? (
    <>
      <div className={styles.teamInfo}>
        <span className={styles.teamName}>{entry.teamName}</span>
        <span className={styles.teamId}>{'ID · ' + teamId}</span>
      </div>
    </>
  ) : null;

  return (
    <div className={styles.screen}>
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ariaLabel={copy.teamInfoDrawerLabel}
        header={drawerHeader}
      >
        {entry
          ? <TeamInfoPanel entry={entry} teamId={teamId} showFollow={isGuestMode} navLinksMode={navLinksMode} />
          : !entryIsError && <TeamInfoPanelSkeleton />}
      </Drawer>

      <div className={styles.squadCol}>
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <div className={styles.headerLeft}>
              {isGuestMode && (
                <button className={styles.backBtn} onClick={() => navigate(returnTo)} aria-label={copy.squadGuestBack}>
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M10 4l-4 4 4 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {copy.squadGuestBack}
                </button>
              )}
              <button
                className={styles.burgerBtn}
                onClick={() => setDrawerOpen(true)}
                aria-label={copy.teamInfoOpenDrawer}
              >
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M3 5h14M3 10h14M3 15h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              {!isGuestMode && (
                <div className={styles.teamInfo}>
                  <span className={styles.teamName}>{entry?.teamName ?? ' '}</span>
                  <span className={styles.teamId}>{'ID · ' + teamId}</span>
                </div>
              )}
            </div>
            {isGuestMode && (
              <div className={styles.teamInfoCenter}>
                <span className={styles.teamName}>{entry?.teamName ?? ' '}</span>
                <span className={styles.teamId}>{'ID · ' + teamId}</span>
              </div>
            )}
            {!isGuestMode && (
              <Button variant="link" onClick={handleChangeTeam}>
                {copy.squadChangeTeam}
              </Button>
            )}
          </div>

          <div className={styles.viewToggleWrap}>
            <ViewToggle value={view} onChange={handleViewChange} />
            {isGuestMode && (
              <button
                className={`${styles.followHeaderBtn} ${followingTeam ? styles.followHeaderBtn_following : ''}`}
                onClick={toggleFollowTeam}
                aria-pressed={followingTeam}
                disabled={!followingTeam && followLimitReached}
              >
                {followingTeam ? copy.watchlistUnfollowButton : copy.watchlistFollowButton}
              </button>
            )}
          </div>

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
              <svg
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className={styles.chevronRight}
              >
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
        </header>

        {squad && (
          <div className={styles.summaryWrap}>
            <SummaryStrip summary={squad.summary} activeChip={squad.activeChip} />
          </div>
        )}
        {isLoading && <div className={styles.summaryPlaceholder} aria-hidden="true" />}

        {isLoading && (view === 'list' ? <ListViewSkeleton /> : <SquadSkeleton />)}

        {entryIsError && (
          <div className={styles.stateCenter}>
            <p className={styles.stateText}>{copy.squadNotFound}</p>
            <Button variant="secondary" onClick={handleChangeTeam}>
              {copy.squadChangeTeam}
            </Button>
          </div>
        )}

        {isSquadError && (
          <div className={styles.stateCenter}>
            <p className={styles.stateText}>{copy.squadLoadError}</p>
            <Button variant="secondary" onClick={() => refetch()}>
              {copy.squadRetry}
            </Button>
          </div>
        )}

        {isNoSquad && (
          <div className={styles.stateCenter}>
            <div className={styles.emptyPitchIcon}>
              <Pitch>
                <div className={styles.emptyPitchQ}>?</div>
              </Pitch>
            </div>
            <p className={styles.stateHeading}>{copy.squadEmptyHeading}</p>
            <p className={styles.stateText}>
              {interpolate(copy.squadEmptySubtext, { GW: selectedGw ?? '' })}
            </p>
            {currentGw !== null && selectedGw !== currentGw && (
              <Button variant="primary" onClick={jumpToCurrent}>
                {copy.squadJumpToCurrent}
              </Button>
            )}
          </div>
        )}

        {squad &&
          squad.starters.length > 0 &&
          (view === 'list' ? (
            <ListView starters={squad.starters} bench={squad.bench} />
          ) : (
            positionGroups && (
              <div className={styles.pitchBench}>
                <div className={styles.pitchWrap}>
                  <Pitch className={styles.pitchFill}>
                    <div className={styles.pitchRows}>
                      {POSITION_ORDER.map((pos) => (
                        <div key={pos} className={styles.playerRow}>
                          {positionGroups[pos].map((player) => {
                            const pool = poolLookup?.get(player.id);
                            return (
                              <FollowableCard
                                key={player.id}
                                player={player}
                                size="large"
                                nextFixture={isNextGw ? pool?.nextFixtures[0] : undefined}
                                playerInfo={
                                  pool
                                    ? {
                                        ownership: pool.selectedByPercent,
                                        currentPrice: pool.nowCost,
                                        nextFixtures: pool.nextFixtures,
                                        statBreakdown: player.statBreakdown,
                                      }
                                    : undefined
                                }
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </Pitch>
                </div>

                <div className={styles.bench}>
                  <div className={styles.benchLabels}>
                    {squad.bench.map((player, i) => (
                      <span key={player.id} className={styles.benchLabel}>
                        {benchLabel(i, player.position)}
                      </span>
                    ))}
                  </div>
                  <div className={styles.benchRow}>
                    {squad.bench.map((player) => {
                      const pool = poolLookup?.get(player.id);
                      return (
                        <FollowableCard
                          key={player.id}
                          player={player}
                          size="medium"
                          playerInfo={
                            pool
                              ? {
                                  ownership: pool.selectedByPercent,
                                  currentPrice: pool.nowCost,
                                  nextFixtures: pool.nextFixtures,
                                  statBreakdown: player.statBreakdown,
                                }
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )
          ))}
      </div>
    </div>
  );
};

SquadScreen.displayName = 'SquadScreen';

function FollowableCard(props: React.ComponentProps<typeof PlayerCard>) {
  const { following, toggle } = useFollowPlayer(props.player.id);
  const showFollow = !!props.playerInfo;
  return (
    <PlayerCard
      {...props}
      onFollow={showFollow ? () => toggle() : undefined}
      isFollowing={following}
    />
  );
}

function SquadSkeleton() {
  return (
    <div className={styles.pitchBench} aria-label={copy.loadingPlaceholder} aria-busy="true">
      <div className={styles.pitchWrap}>
        <Pitch className={styles.pitchFill}>
          <div className={styles.skeletonVeil} />
          <div className={styles.pitchRows}>
            {[2, 4, 4, 1].map((count, rowIdx) => (
              <div key={rowIdx} className={styles.playerRow}>
                {Array.from({ length: count }).map((_, i) => (
                  <PlayerSkeleton key={i} size="large" />
                ))}
              </div>
            ))}
          </div>
        </Pitch>
      </div>
      <div className={styles.bench}>
        <div className={styles.benchLabels}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeletonLabel} />
          ))}
        </div>
        <div className={styles.benchRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <PlayerSkeleton key={i} size="medium" />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerSkeleton({ size }: { size: 'large' | 'medium' }) {
  return (
    <div className={`${styles.skeletonPlayer} ${styles[`skeletonPlayer_${size}`]}`}>
      <div className={styles.skeletonJersey} />
      <div className={styles.skeletonNameBar} />
    </div>
  );
}
