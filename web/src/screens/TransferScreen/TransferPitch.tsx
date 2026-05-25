import React from 'react';
import { Pitch } from '@/components/ui/Pitch/Pitch';
import { PlayerCard } from '@/components/ui/PlayerCard/PlayerCard';
import type { PlayerPosition, SquadPlayer } from '@/types';
import styles from './TransferPitch.module.css';

const POSITION_ORDER: PlayerPosition[] = ['FWD', 'MID', 'DEF', 'GK'];

export interface TransferPitchProps {
  starters: SquadPlayer[];
  bench: SquadPlayer[];
  outPlayerId: number | null;
  inPlayerIds: Set<number>;
  onPlayerClick: (id: number) => void;
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
}) => {
  const positionGroups = groupByPosition(starters);

  return (
    <div className={styles.pitchBench}>
      <div className={styles.pitchWrap}>
        <Pitch className={styles.pitchFill}>
          <div className={styles.pitchRows}>
            {POSITION_ORDER.map((pos) => (
              <div key={pos} className={styles.playerRow}>
                {positionGroups[pos].map((player) => {
                  const isOut = player.id === outPlayerId;
                  const isIn = inPlayerIds.has(player.id);
                  return (
                    <button
                      key={player.id}
                      className={`${styles.playerBtn} ${isOut ? styles.playerBtn_out : ''} ${isIn ? styles.playerBtn_in : ''}`}
                      onClick={() => onPlayerClick(player.id)}
                      aria-label={`${player.name}${isOut ? ' (OUT)' : isIn ? ' (IN)' : ''}`}
                    >
                      <PlayerCard player={player} size="large" />
                      {isOut && <span className={styles.variantBadge} data-variant="out">OUT</span>}
                      {isIn && <span className={styles.variantBadge} data-variant="in">IN</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Pitch>
      </div>

      <div className={styles.bench}>
        {bench.map((player) => {
          const isOut = player.id === outPlayerId;
          const isIn = inPlayerIds.has(player.id);
          return (
            <button
              key={player.id}
              className={`${styles.playerBtn} ${isOut ? styles.playerBtn_out : ''} ${isIn ? styles.playerBtn_in : ''}`}
              onClick={() => onPlayerClick(player.id)}
              aria-label={`${player.name}${isOut ? ' (OUT)' : isIn ? ' (IN)' : ''}`}
            >
              <PlayerCard player={player} size="medium" />
              {isOut && <span className={styles.variantBadge} data-variant="out">OUT</span>}
              {isIn && <span className={styles.variantBadge} data-variant="in">IN</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

TransferPitch.displayName = 'TransferPitch';
