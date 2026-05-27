import React, { useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ApiError } from '@/api/client';
import { useDreamTeam, useGameweeks } from '@/api/queries';
import { Button } from '@/components/ui/Button/Button';
import { Pitch } from '@/components/ui/Pitch/Pitch';
import { PlayerCard } from '@/components/ui/PlayerCard/PlayerCard';
import { copy } from '@/lib/copy';
import type { DreamTeamPlayer, PlayerPosition, PlayerStatus, SquadPlayer } from '@/types';
import { MAX_GAMEWEEK } from '@/types';

import styles from './DreamTeamScreen.module.css';

const POSITION_ORDER: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];

function withTransition(update: () => void): void {
  if (!document.startViewTransition) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}

function toSquadPlayer(p: DreamTeamPlayer): SquadPlayer {
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

function groupByPosition(players: DreamTeamPlayer[]): Record<PlayerPosition, DreamTeamPlayer[]> {
  const groups: Record<PlayerPosition, DreamTeamPlayer[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of players) {
    groups[p.position].push(p);
  }
  return groups;
}

export const DreamTeamScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: gameweeksData } = useGameweeks();

  const finishedGws = useMemo(
    () => gameweeksData?.gameweeks.filter((gw) => gw.finished) ?? [],
    [gameweeksData]
  );

  const latestFinishedGw = finishedGws.length > 0 ? finishedGws[finishedGws.length - 1].id : null;

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

  const { data, isLoading, isError, error, refetch } = useDreamTeam(
    selectedGwFinished ? selectedGw : null
  );

  const isNotAvailable = !selectedGwFinished && selectedGw !== null;
  const is400 = isError && error instanceof ApiError && error.status === 400;
  const isRealError = isError && !is400;

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

  const handleBack = () => {
    const teamIdParam = searchParams.get('teamId');
    const gwBackParam = searchParams.get('gw');
    navigate(
      `/${teamIdParam ? `?teamId=${teamIdParam}` : ''}${gwBackParam && teamIdParam ? `&gw=${gwBackParam}` : ''}`
    );
  };

  const positionGroups = useMemo(() => {
    if (!data) return null;
    return groupByPosition(data.players);
  }, [data]);

  const gwLabel = selectedGw !== null ? `GW ${selectedGw}` : '';

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack} aria-label={copy.dreamTeamBack}>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M10 4l-4 4 4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {copy.dreamTeamBack}
        </button>

        <div className={styles.heading}>
          <span className={styles.title}>{copy.dreamTeamTitle}</span>
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
      </header>

      {isLoading && <PitchSkeleton />}

      {isRealError && (
        <div className={styles.stateCenter}>
          <p className={styles.stateText}>{copy.dreamTeamLoadError}</p>
          <Button variant="secondary" onClick={() => refetch()}>
            {copy.dreamTeamRetry}
          </Button>
        </div>
      )}

      {(isNotAvailable || is400) && (
        <div className={styles.stateCenter}>
          <p className={styles.stateText}>{copy.dreamTeamNotAvailable}</p>
        </div>
      )}

      {data && positionGroups && (
        <div className={styles.pitchWrap}>
          <Pitch className={styles.pitchFill} preserveAspectRatio="none">
            <div className={styles.pitchRows}>
              {POSITION_ORDER.map((pos) => (
                <div key={pos} className={styles.playerRow}>
                  {positionGroups[pos].map((player) => (
                    <PlayerCard key={player.id} player={toSquadPlayer(player)} size="large" />
                  ))}
                </div>
              ))}
            </div>
          </Pitch>
        </div>
      )}
    </div>
  );
};

DreamTeamScreen.displayName = 'DreamTeamScreen';

function PitchSkeleton() {
  return (
    <div className={styles.pitchWrap} aria-label={copy.loadingPlaceholder} aria-busy="true">
      <Pitch className={styles.pitchFill} preserveAspectRatio="none">
        <div className={styles.skeletonVeil} />
        <div className={styles.pitchRows}>
          {[1, 3, 4, 3].map((count, rowIdx) => (
            <div key={rowIdx} className={styles.playerRow}>
              {Array.from({ length: count }).map((_, i) => (
                <PlayerSkeleton key={i} />
              ))}
            </div>
          ))}
        </div>
      </Pitch>
    </div>
  );
}

function PlayerSkeleton() {
  return (
    <div className={styles.skeletonPlayer}>
      <div className={styles.skeletonJersey} />
      <div className={styles.skeletonNameBar} />
    </div>
  );
}
