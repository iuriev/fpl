import React from 'react';

import { Pitch } from '@/components/ui/Pitch/Pitch';
import type { PlayerInfo } from '@/components/ui/PlayerCard/PlayerCard';
import { PlayerCard } from '@/components/ui/PlayerCard/PlayerCard';
import type { PlayerPosition, PoolPlayer, SquadPlayer } from '@/types';

import styles from './TransferPitch.module.css';

const POSITION_ORDER: PlayerPosition[] = ['FWD', 'MID', 'DEF', 'GK'];

export interface TransferPitchProps {
  starters: SquadPlayer[];
  bench: SquadPlayer[];
  outPlayerId: number | null;
  inPlayerIds: Set<number>;
  onPlayerClick: (id: number) => void;
  poolLookup?: Map<number, PoolPlayer>;
  selectedSubId?: number | null;
  validSubTargets?: Set<number>;
  onSubIconClick?: (id: number) => void;
  onSubTargetClick?: (id: number) => void;
  onSubCancel?: () => void;
}

function groupByPosition(players: SquadPlayer[]): Record<PlayerPosition, SquadPlayer[]> {
  const groups: Record<PlayerPosition, SquadPlayer[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of players) groups[p.position].push(p);
  return groups;
}

export const TransferPitch: React.FC<TransferPitchProps> = ({
  starters,
  bench,
  outPlayerId,
  inPlayerIds,
  onPlayerClick,
  poolLookup,
  selectedSubId = null,
  validSubTargets = new Set(),
  onSubIconClick,
  onSubTargetClick,
  onSubCancel,
}) => {
  const positionGroups = groupByPosition(starters);

  const subModeActive = selectedSubId !== null;

  function playerBtnClass(playerId: number, isOut: boolean, isIn: boolean): string {
    const base = styles.playerBtn;
    if (isOut || playerId === selectedSubId) return `${base} ${styles.playerBtn_out}`;
    if (isIn) return `${base} ${styles.playerBtn_in}`;
    if (subModeActive) {
      return validSubTargets.has(playerId)
        ? `${base} ${styles.playerBtn_subTarget}`
        : `${base} ${styles.playerBtn_dimmed}`;
    }
    return base;
  }

  function handleCardClick(playerId: number) {
    if (subModeActive) {
      if (validSubTargets.has(playerId)) onSubTargetClick?.(playerId);
    } else {
      onPlayerClick(playerId);
    }
  }

  function buildPlayerInfo(player: SquadPlayer): PlayerInfo | undefined {
    const p = poolLookup?.get(player.id);
    if (!p) return undefined;
    return {
      ownership: p.selectedByPercent,
      currentPrice: p.nowCost,
      expectedPoints: p.expectedPoints,
      nextFixtures: p.nextFixtures,
    };
  }

  function renderCard(player: SquadPlayer, size: 'large' | 'medium') {
    const isOut = player.id === outPlayerId;
    const isIn = inPlayerIds.has(player.id);
    const label =
      player.id === selectedSubId
        ? `${player.name} (SUB OUT)`
        : validSubTargets.has(player.id)
          ? `${player.name} (SUB TARGET)`
          : `${player.name}${isOut ? ' (OUT)' : isIn ? ' (IN)' : ''}`;

    let tourAttr = undefined;
    if (size === 'large' && player.position === 'GK') {
      tourAttr = 'step-6'; // representative for swap arrows
    }

    return (
      <button
        key={player.id}
        className={playerBtnClass(player.id, isOut, isIn)}
        onClick={() => handleCardClick(player.id)}
        aria-label={label}
        data-tour={tourAttr}
      >
        <PlayerCard
          player={player}
          size={size}
          hidePoints
          hideStats
          hideClub
          hideCaptaincy
          nextFixture={poolLookup?.get(player.id)?.nextFixtures[0]}
          playerInfo={buildPlayerInfo(player)}
          onSubClick={
            !subModeActive && onSubIconClick ? () => onSubIconClick(player.id) : undefined
          }
        />
      </button>
    );
  }

  function handlePitchBackgroundClick(e: React.MouseEvent<HTMLDivElement>) {
    if (subModeActive && !(e.target as Element).closest('button')) onSubCancel?.();
  }

  return (
    <div className={styles.pitchBench}>
      <div className={styles.pitchWrap} onClick={handlePitchBackgroundClick}>
        <Pitch className={styles.pitchFill} preserveAspectRatio="none">
          <div className={styles.pitchRows}>
            {POSITION_ORDER.map((pos) => (
              <div key={pos} className={styles.playerRow}>
                {positionGroups[pos].map((player) => renderCard(player, 'large'))}
              </div>
            ))}
          </div>
        </Pitch>
      </div>

      <div className={styles.bench} data-tour="step-7">{bench.map((player) => renderCard(player, 'medium'))}</div>
    </div>
  );
};

TransferPitch.displayName = 'TransferPitch';
