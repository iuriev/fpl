import React from 'react';

import { Pitch } from '@/components/ui/Pitch/Pitch';
import type { PlayerInfo } from '@/components/ui/PlayerCard/PlayerCard';
import { PlayerCard } from '@/components/ui/PlayerCard/PlayerCard';
import { copy } from '@/lib/copy';
import type { PlayerPosition, PoolPlayer, SquadPlayer } from '@/types';

import styles from './TransferPitch.module.css';

const POSITION_ORDER: PlayerPosition[] = ['FWD', 'MID', 'DEF', 'GK'];

export interface TransferPitchProps {
  starters: SquadPlayer[];
  bench: SquadPlayer[];
  startersPredictedTotal: number | null;
  outPlayerId: number | null;
  inPlayerIds: Set<number>;
  onPlayerClick: (id: number) => void;
  poolLookup?: Map<number, PoolPlayer>;
  selectedSubId?: number | null;
  validSubTargets?: Set<number>;
  onSubIconClick?: (id: number) => void;
  onSubTargetClick?: (id: number) => void;
  onSubCancel?: () => void;
  isAiLoading?: boolean;
}

function groupByPosition(players: SquadPlayer[]): Record<PlayerPosition, SquadPlayer[]> {
  const groups: Record<PlayerPosition, SquadPlayer[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of players) groups[p.position].push(p);
  return groups;
}

function pickTourAnchorId(
  starters: SquadPlayer[],
  poolLookup?: Map<number, PoolPlayer>,
): number | null {
  const fwd = starters.find((p) => p.position === 'FWD' && poolLookup?.get(p.id));
  if (fwd) return fwd.id;
  const withPool = starters.find((p) => poolLookup?.get(p.id));
  return withPool?.id ?? starters[0]?.id ?? null;
}

export const TransferPitch: React.FC<TransferPitchProps> = ({
  starters,
  bench,
  startersPredictedTotal,
  outPlayerId,
  inPlayerIds,
  onPlayerClick,
  poolLookup,
  selectedSubId = null,
  validSubTargets = new Set(),
  onSubIconClick,
  onSubTargetClick,
  onSubCancel,
  isAiLoading = false,
}) => {
  const positionGroups = groupByPosition(starters);
  const tourAnchorId = pickTourAnchorId(starters, poolLookup);

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
          ownershipTourAttr={player.id === tourAnchorId ? 'step-4' : undefined}
          fixtureTourAttr={player.id === tourAnchorId ? 'step-5' : undefined}
          subTourAttr={tourAttr}
          reserveSubSlot={!!onSubIconClick}
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
    <div className={`${styles.pitchBench}${isAiLoading ? ` ${styles.pitchBench_aiLoading}` : ''}`}>
      {isAiLoading && (
        <div className={styles.aiLoadingOverlay} aria-live="polite" aria-label={copy.aiFreehitLoading}>
          <div className={styles.aiSpinner} />
        </div>
      )}
      <div className={styles.pitchWrap} onClick={handlePitchBackgroundClick}>
        {startersPredictedTotal !== null && (
          <div className={styles.predictedTotal} aria-label={copy.transferPitchPredictedTotal}>
            <span className={styles.predictedTotalLabel}>{copy.transferPitchPredictedTotal}</span>
            <span className={styles.predictedTotalValue}>
              {startersPredictedTotal.toFixed(1)}
            </span>
          </div>
        )}
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
