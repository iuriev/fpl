import React from 'react';

import { FdrChip } from '@/components/ui/FdrChip/FdrChip';
import type { PoolPlayer } from '@/types';

import styles from './PlayerPickerRow.module.css';

export interface PlayerPickerRowProps {
  player: PoolPlayer;
  overBudget: boolean;
  clubLimitReached: boolean;
  positionLimitReached: boolean;
  onSelect: (player: PoolPlayer) => void;
}

export const PlayerPickerRow: React.FC<PlayerPickerRowProps> = ({
  player,
  overBudget,
  clubLimitReached,
  positionLimitReached,
  onSelect,
}) => {
  const disabled = overBudget || clubLimitReached || positionLimitReached;

  return (
    <li
      className={`${styles.row} ${disabled ? styles.row_disabled : ''}`}
      data-over-budget={overBudget ? 'true' : undefined}
      data-club-limit={clubLimitReached ? 'true' : undefined}
      data-position-limit={positionLimitReached ? 'true' : undefined}
      onClick={disabled ? undefined : () => onSelect(player)}
      role={disabled ? undefined : 'button'}
      tabIndex={disabled ? undefined : 0}
      onKeyDown={
        disabled
          ? undefined
          : (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(player);
              }
            }
      }
    >
      <div className={styles.identity}>
        <span className={styles.name}>{player.webName}</span>
        <span className={styles.meta}>{player.teamShortName}</span>
        {clubLimitReached && <span className={styles.clubTag}>3 already</span>}
        {positionLimitReached && <span className={styles.clubTag}>pos. full</span>}
      </div>
      <div className={styles.fixtures}>
        {player.nextFixtures.slice(0, 3).map((f, i) => (
          <FdrChip key={i} opponent={f.opponent} home={f.home} difficulty={f.difficulty} />
        ))}
      </div>
      <div className={`${styles.cost} ${overBudget ? styles.cost_over : ''}`}>
        £{(player.nowCost / 10).toFixed(1)}m
      </div>
    </li>
  );
};

PlayerPickerRow.displayName = 'PlayerPickerRow';
