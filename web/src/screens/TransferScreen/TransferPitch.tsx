import React from 'react';

import { Pitch } from '@/components/ui/Pitch/Pitch';
import { PlayerCard } from '@/components/ui/PlayerCard/PlayerCard';
import type { PlayerPosition, PoolPlayer, SquadPlayer } from '@/types';

import styles from './TransferPitch.module.css';

const POSITION_ORDER: PlayerPosition[] = ['FWD', 'MID', 'DEF', 'GK'];

function SubIcon() {
  return (
    <span className={styles.subIcon}>
      <svg width="10" height="10" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M3 4H7V11H10L5 18L0 11H3Z" fill="#E8604C"/>
        <path d="M19 18H15V11H12L17 4L22 11H19Z" fill="#00FF87"/>
      </svg>
    </span>
  );
}

export interface TransferPitchProps {
  starters: SquadPlayer[];
  bench: SquadPlayer[];
  outPlayerId: number | null;
  inPlayerIds: Set<number>;
  onPlayerClick: (id: number) => void;
  poolLookup?: Map<number, PoolPlayer>;
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
                      <PlayerCard
                        player={player}
                        size="large"
                        hidePoints
                        nextFixture={poolLookup?.get(player.id)?.nextFixtures[0]}
                        footBadge={isIn ? <SubIcon /> : undefined}
                      />
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
              <PlayerCard
                player={player}
                size="medium"
                hidePoints
                nextFixture={poolLookup?.get(player.id)?.nextFixtures[0]}
                footBadge={isIn ? <SubIcon /> : undefined}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

TransferPitch.displayName = 'TransferPitch';
