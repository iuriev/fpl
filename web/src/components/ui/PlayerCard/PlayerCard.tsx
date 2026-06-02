import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

import { copy } from '@/lib/copy';
import { chipColorKey, formatStatLabel, HIDDEN_STATS } from '@/lib/stat-chips';
import type { FixtureInfo, PlayerStatus, SquadPlayer, StatEntry } from '@/types';

import { FdrChip } from '../FdrChip/FdrChip';
import { Jersey } from '../Jersey/Jersey';
import styles from './PlayerCard.module.css';

export interface PlayerInfo {
  ownership: string;
  currentPrice: number;
  expectedPoints?: string;
  nextFixtures: FixtureInfo[];
  statBreakdown?: StatEntry[];
}

export interface PlayerCardProps {
  player: SquadPlayer;
  size?: 'large' | 'medium';
  hidePoints?: boolean;
  hideStats?: boolean;
  nextFixture?: FixtureInfo;
  hideClub?: boolean;
  footBadge?: React.ReactNode;
  onSubClick?: () => void;
  playerInfo?: PlayerInfo;
  hideCaptaincy?: boolean;
  subTourAttr?: string;
}

function availBadge(status: PlayerStatus): { char: string; variant: 'warn' | 'error' } | null {
  const map: Partial<Record<PlayerStatus, { char: string; variant: 'warn' | 'error' }>> = {
    d: { char: '!', variant: 'warn' },
    i: { char: '+', variant: 'error' },
    s: { char: '!', variant: 'error' },
    u: { char: '×', variant: 'error' },
    n: { char: '×', variant: 'error' },
  };
  return map[status] ?? null;
}

function statusLabel(status: PlayerStatus): string {
  const labels: Partial<Record<PlayerStatus, string>> = {
    d: copy.statusDoubtful,
    i: copy.statusInjured,
    s: copy.statusSuspended,
    u: copy.statusUnavailable,
    n: copy.statusUnavailable,
  };
  return labels[status] ?? '';
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  size = 'medium',
  hidePoints = false,
  hideStats = false,
  nextFixture,
  hideClub = false,
  footBadge,
  onSubClick,
  playerInfo,
  hideCaptaincy = false,
  subTourAttr,
}) => {
  const [showStatus, setShowStatus] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const popupId = useId();
  const badge = availBadge(player.status);
  const isFlagged = badge !== null;
  const isClickable = !!playerInfo || isFlagged;

  const toggle = useCallback(() => {
    if (playerInfo) {
      setShowStatus(false);
      setShowInfo((v) => !v);
    } else if (isFlagged) {
      setShowStatus((v) => !v);
    }
  }, [playerInfo, isFlagged]);

  useEffect(() => {
    if (!showStatus) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowStatus(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowStatus(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [showStatus]);

  useEffect(() => {
    if (!showInfo) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowInfo(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowInfo(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [showInfo]);

  return (
    <div
      ref={ref}
      className={`${styles.card} ${isClickable ? styles.flagged : ''}`}
      onClick={toggle}
      role={isClickable ? 'button' : undefined}
      aria-label={isClickable ? copy.playerInfoOpen : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-expanded={isClickable ? (showInfo || showStatus) : undefined}
      aria-controls={isClickable ? popupId : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                toggle();
              }
              if (e.key === ' ') {
                e.preventDefault();
              }
            }
          : undefined
      }
      onKeyUp={
        isClickable
          ? (e) => {
              if (e.key === ' ') toggle();
            }
          : undefined
      }
    >
      <div className={styles.jerseyWrap}>
        {(footBadge || badge || (!hideCaptaincy && (player.isCaptain || player.isViceCaptain))) && (
          <div className={styles.badgeRow}>
            <div className={styles.badgeRow_left}>
              {footBadge && <span aria-hidden="true">{footBadge}</span>}
              {badge && (
                <span
                  className={`${styles.availBadge} ${styles[`availBadge_${badge.variant}`]}`}
                  aria-hidden="true"
                >
                  {badge.char}
                </span>
              )}
            </div>
            <div className={styles.badgeRow_right}>
              {!hideCaptaincy && (player.isCaptain || player.isViceCaptain) && (
                <span
                  className={`${styles.capBadge}${player.isViceCaptain ? ` ${styles.capBadge_vice}` : ''}`}
                  aria-label={player.isCaptain ? 'Captain' : 'Vice captain'}
                >
                  {player.isCaptain ? copy.statusCaptain : copy.statusViceCaptain}
                </span>
              )}
            </div>
          </div>
        )}
        <Jersey
          size={size}
          teamCode={player.teamCode}
          position={player.position}
          alt={player.name}
        />
        {!hideStats && size === 'large' && (player.stats.goals_scored > 0 || player.stats.assists > 0) && (
          <div className={styles.statBadges}>
            {player.stats.goals_scored > 0 && (
              <span className={styles.goalBadge}>{player.stats.goals_scored} ⚽</span>
            )}
            {player.stats.assists > 0 && (
              <span className={styles.assistBadge}>{player.stats.assists} A</span>
            )}
          </div>
        )}
      </div>

      <div className={styles.pill}>
        <span className={styles.name}>{player.name}</span>
        {!hidePoints && <span className={styles.points}>{player.points}</span>}
      </div>
      {playerInfo && (
        <span className={styles.ownershipPill} data-tour="step-4">
          {playerInfo.ownership}%{playerInfo.expectedPoints ? ` / ${playerInfo.expectedPoints}` : ''}
        </span>
      )}

      {(nextFixture || onSubClick) && (
        <div className={styles.fixtureRow}>
          {!hideClub && <span className={styles.teamAbbrev}>{player.club}</span>}
          {nextFixture && (
            <FdrChip
              opponent={nextFixture.opponent}
              home={nextFixture.home}
              difficulty={nextFixture.difficulty}
              data-tour="step-5"
            />
          )}
          {onSubClick && (
            <span
              className={styles.subBtn}
              onClick={(e) => {
                e.stopPropagation();
                onSubClick();
              }}
              role="button"
              aria-label="Substitute"
              data-tour={subTourAttr}
            >
              <svg width="8" height="10" viewBox="0 0 10 12" fill="none" aria-hidden="true">
                <path d="M5 1L1 5H9L5 1Z" fill="currentColor" />
                <path d="M5 11L1 7H9L5 11Z" fill="currentColor" />
              </svg>
            </span>
          )}
        </div>
      )}

      {showInfo && playerInfo && (
        <div id={popupId} className={styles.infoPopup} role="dialog" aria-label={copy.playerInfoOpen} onClick={(e) => e.stopPropagation()}>
          <div className={styles.infoHeader}>
            <div className={styles.infoHeaderText}>
              <span className={styles.infoName}>{player.name}</span>
              <span className={styles.infoMeta}>
                £{(playerInfo.currentPrice / 10).toFixed(1)}m · {playerInfo.ownership}%{playerInfo.expectedPoints ? ` · ${playerInfo.expectedPoints} XP` : ''} · {player.position} / {player.club}
              </span>
            </div>
            <div
              className={styles.infoClose}
              onClick={(e) => {
                e.stopPropagation();
                setShowInfo(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowInfo(false);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Close"
            >
              ✕
            </div>
          </div>
          <div className={styles.infoBody}>
            {playerInfo.statBreakdown && playerInfo.statBreakdown.length > 0 && (() => {
              const chips = playerInfo.statBreakdown.filter(
                (s) => !HIDDEN_STATS.has(s.identifier) && s.value !== 0
              );
              return chips.length > 0 ? (
                <div className={styles.infoStatChips}>
                  {chips.map((s) => (
                    <span
                      key={s.identifier}
                      className={`${styles.infoChip} ${styles[chipColorKey(s.identifier) as keyof typeof styles] ?? styles.infoChipNegative}`}
                    >
                      {formatStatLabel(s.identifier, s.value, s.points)}
                    </span>
                  ))}
                </div>
              ) : null;
            })()}
            <span className={styles.infoSectionLabel}>{copy.playerInfoUpcomingFixtures}</span>
            {playerInfo.nextFixtures.slice(0, 5).map((f, i) => (
              <div key={i} className={styles.infoFixtureRow}>
                <span className={styles.infoGw}>GW{f.gw}</span>
                <FdrChip opponent={f.opponent} home={f.home} difficulty={f.difficulty} />
              </div>
            ))}
          </div>
        </div>
      )}

      {showStatus && badge && (
        <div className={styles.statusPopup} onClick={(e) => e.stopPropagation()}>
          <span className={`${styles.statusLabel} ${styles[`statusLabel_${badge.variant}`]}`}>
            {statusLabel(player.status)}
          </span>
          {player.chanceOfPlaying != null && (
            <span className={styles.chance}>{player.chanceOfPlaying}% chance of playing</span>
          )}
          {player.news && <span className={styles.news}>{player.news}</span>}
        </div>
      )}
    </div>
  );
};

PlayerCard.displayName = 'PlayerCard';
