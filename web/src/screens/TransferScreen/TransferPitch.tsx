import React from 'react';

import { Pitch } from '@/components/ui/Pitch/Pitch';
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
                      />
                      {isOut && <span className={styles.variantBadge} data-variant="out">OUT</span>}
                      {isIn && (
                        <span className={styles.variantBadge} data-variant="in" aria-label="Transfer in">
                          <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                            <path d="M10.5 6A4.5 4.5 0 1 1 6 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            <path d="M4.5 0L6.5 1.5L4.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      )}
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
              />
              {isOut && <span className={styles.variantBadge} data-variant="out">OUT</span>}
              {isIn && (
                <span className={styles.variantBadge} data-variant="in" aria-label="Transfer in">
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M10.5 6A4.5 4.5 0 1 1 6 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M4.5 0L6.5 1.5L4.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

TransferPitch.displayName = 'TransferPitch';
