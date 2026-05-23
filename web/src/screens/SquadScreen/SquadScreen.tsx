import React, { useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useSearchParams } from 'react-router-dom';

import { ApiError } from '@/api/client';
import { useEntry, useGameweeks, useSquad } from '@/api/queries';
import { Button } from '@/components/ui/Button/Button';
import { ListView, ListViewSkeleton } from '@/components/ui/ListView/ListView';
import { Pitch } from '@/components/ui/Pitch/Pitch';
import { PlayerCard } from '@/components/ui/PlayerCard/PlayerCard';
import { SummaryStrip } from '@/components/ui/SummaryStrip/SummaryStrip';
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle/ViewToggle';
import { copy, interpolate } from '@/lib/copy';
import type { PlayerPosition, SquadPlayer } from '@/types';
import { MAX_GAMEWEEK } from '@/types';

import styles from './SquadScreen.module.css';

export interface SquadScreenProps {
  teamId: number;
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

export const SquadScreen: React.FC<SquadScreenProps> = ({ teamId }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: gameweeksData } = useGameweeks();
  const { data: entry, isError: entryIsError } = useEntry(teamId);

  const currentGw = gameweeksData?.current ?? null;
  const maxGw = currentGw;

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

  const { data: squad, isLoading, isError: squadIsError, error: squadError, refetch } = useSquad(
    entryIsError ? null : teamId,
    selectedGw,
  );

  const isNoSquad = squadIsError && squadError instanceof ApiError && squadError.status === 404;
  const isSquadError = squadIsError && !isNoSquad;

  const jumpToCurrent = () => {
    if (currentGw === null) return;
    withTransition(() =>
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set('gw', String(currentGw));
        return p;
      }),
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
      }),
    );
  };

  const handleViewChange = (mode: ViewMode) => {
    withTransition(() =>
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set('view', mode);
        return p;
      }),
    );
  };

  const handleChangeTeam = () => {
    setSearchParams({});
  };

  const positionGroups = useMemo(() => {
    if (!squad) return null;
    return groupByPosition(squad.starters);
  }, [squad]);

  const gwLabel =
    selectedGw !== null
      ? `${copy.squadGameweekLabel} ${selectedGw}`
      : copy.squadGameweekLabel;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerLeft}>
            <div className={styles.fplMark} aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 17 L7 3 L11 3 L9 9 L13 9 L11 13 L15 13 L9 19 L11 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className={styles.teamInfo}>
              <span className={styles.teamName}>{entry?.teamName ?? ' '}</span>
              <span className={styles.teamId}>{'ID · ' + teamId}</span>
            </div>
          </div>
          <Button variant="link" onClick={handleChangeTeam}>
            {copy.squadChangeTeam}
          </Button>
        </div>

        <div className={styles.viewToggleWrap}>
          <ViewToggle value={view} onChange={handleViewChange} />
        </div>

        <div className={styles.gwNav}>
          <button
            className={styles.navBtn}
            onClick={() => navigateGw(-1)}
            disabled={!canGoPrev}
            aria-label="Previous gameweek"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
              <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      {squad && (
        <div className={styles.summaryWrap}>
          <SummaryStrip summary={squad.summary} />
        </div>
      )}
      {isLoading && <div className={styles.summaryPlaceholder} aria-hidden="true" />}

      {isLoading && (
        view === 'list' ? <ListViewSkeleton /> : <SquadSkeleton />
      )}

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

      {squad && squad.starters.length > 0 && (
        view === 'list' ? (
          <ListView starters={squad.starters} bench={squad.bench} />
        ) : (
          positionGroups && (
            <div className={styles.pitchBench}>
              <div className={styles.pitchWrap}>
                <Pitch className={styles.pitchFill}>
                  <div className={styles.pitchRows}>
                    {POSITION_ORDER.map((pos) => (
                      <div key={pos} className={styles.playerRow}>
                        {positionGroups[pos].map((player) => (
                          <PlayerCard key={player.id} player={player} size="large" />
                        ))}
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
                  {squad.bench.map((player) => (
                    <PlayerCard key={player.id} player={player} size="medium" />
                  ))}
                </div>
              </div>
            </div>
          )
        )
      )}
    </div>
  );
};

SquadScreen.displayName = 'SquadScreen';

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
