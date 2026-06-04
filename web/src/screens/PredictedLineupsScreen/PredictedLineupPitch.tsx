import React from 'react';

import { Pitch } from '@/components/ui/Pitch/Pitch';
import { PlayerCard } from '@/components/ui/PlayerCard/PlayerCard';
import type { PredictedLineupPlayer } from '@/types';

import { hasLineupPlayRisk } from './predicted-lineup-display';
import { groupByPosition, POSITION_ORDER, toSquadPlayer } from './predicted-lineup-helpers';
import styles from './PredictedLineupsScreen.module.css';

export interface PredictedLineupPitchProps {
  players: PredictedLineupPlayer[];
  teamShortName: string;
  teamId: number;
  onSelect: (id: number) => void;
}

export const PredictedLineupPitch: React.FC<PredictedLineupPitchProps> = ({
  players,
  teamShortName,
  teamId,
  onSelect,
}) => {
  const groups = groupByPosition(players);

  return (
    <div className={styles.pitchWrap}>
      <Pitch className={styles.pitchFill} preserveAspectRatio="none">
        <div className={styles.pitchRows}>
          {POSITION_ORDER.map((pos) => (
            <div key={pos} className={styles.playerRow}>
              {groups[pos].map((player) => (
                <button
                  key={player.id}
                  type="button"
                  className={styles.pitchCardBtn}
                  onClick={() => onSelect(player.id)}
                >
                  <PlayerCard
                    player={toSquadPlayer(player, teamShortName, teamId)}
                    size="large"
                    hideClub
                    hideAvailabilityBadge
                    hidePoints
                    showXMinsPill
                    showLineupPlayRisk={hasLineupPlayRisk(player)}
                  />
                </button>
              ))}
            </div>
          ))}
        </div>
      </Pitch>
    </div>
  );
};

PredictedLineupPitch.displayName = 'PredictedLineupPitch';
