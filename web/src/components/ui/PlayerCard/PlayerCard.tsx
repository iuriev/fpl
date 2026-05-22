import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

import { copy } from '@/lib/copy';
import type { PlayerStatus, SquadPlayer } from '@/types';

import { Jersey } from '../Jersey/Jersey';
import styles from './PlayerCard.module.css';

export interface PlayerCardProps {
  player: SquadPlayer;
  size?: 'large' | 'medium';
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

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, size = 'medium' }) => {
  const [showStatus, setShowStatus] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const popupId = useId();
  const badge = availBadge(player.status);
  const isFlagged = badge !== null;

  const toggle = useCallback(() => {
    if (isFlagged) setShowStatus((v) => !v);
  }, [isFlagged]);

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

  return (
    <div
      ref={ref}
      className={`${styles.card} ${isFlagged ? styles.flagged : ''}`}
      onClick={toggle}
      role={isFlagged ? 'button' : undefined}
      tabIndex={isFlagged ? 0 : undefined}
      aria-expanded={isFlagged ? showStatus : undefined}
      aria-controls={isFlagged ? popupId : undefined}
      onKeyDown={
        isFlagged
          ? (e) => {
              if (e.key === 'Enter') { e.preventDefault(); toggle(); }
              if (e.key === ' ') { e.preventDefault(); }
            }
          : undefined
      }
      onKeyUp={
        isFlagged
          ? (e) => { if (e.key === ' ') toggle(); }
          : undefined
      }
    >
      <div className={styles.jerseyWrap}>
        {(player.isCaptain || player.isViceCaptain) && (
          <span
            className={`${styles.capBadge}${player.isViceCaptain ? ` ${styles.capBadge_vice}` : ''}`}
            aria-label={player.isCaptain ? 'Captain' : 'Vice captain'}
          >
            {player.isCaptain ? copy.statusCaptain : copy.statusViceCaptain}
          </span>
        )}
        {badge && (
          <span
            className={`${styles.availBadge} ${styles[`availBadge_${badge.variant}`]}`}
            aria-hidden="true"
          >
            {badge.char}
          </span>
        )}
        <Jersey size={size} teamCode={player.teamCode} position={player.position} alt={player.name} />
      </div>

      <div className={styles.pill}>
        <span className={styles.name}>{player.name}</span>
        <span className={styles.points}>{player.points}</span>
      </div>

      {showStatus && badge && (
        <div
          id={popupId}
          className={styles.statusPopup}
          onClick={(e) => e.stopPropagation()}
        >
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