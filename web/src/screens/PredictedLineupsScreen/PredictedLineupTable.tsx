import React from 'react';

import { copy } from '@/lib/copy';
import type { PredictedLineupPlayer } from '@/types';

import styles from './PredictedLineupsScreen.module.css';

export interface PredictedLineupTableProps {
  players: PredictedLineupPlayer[];
  onSelect: (id: number) => void;
}

export const PredictedLineupTable: React.FC<PredictedLineupTableProps> = ({
  players,
  onSelect,
}) => {
  const sorted = [...players].sort((a, b) => {
    const posOrder = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
    if (posOrder[a.position] !== posOrder[b.position]) {
      return posOrder[a.position] - posOrder[b.position];
    }
    return a.pitchOrder - b.pitchOrder;
  });

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th scope="col">{copy.predictedLineupsColumnName}</th>
          <th scope="col">{copy.predictedLineupsColumnXMins}</th>
          <th scope="col">{copy.predictedLineupsColumnXPts}</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((player) => (
          <tr key={player.id}>
            <td>
              <button
                type="button"
                className={`${styles.tableRowBtn} ${player.benchRisk || player.injuryWarning ? styles.tableRowBenchRisk : ''}`}
                onClick={() => onSelect(player.id)}
              >
                <span className={styles.tableName}>{player.webName}</span>
                {player.injuryWarning && (
                  <span className={styles.injuryWarningBadge}>
                    {copy.predictedLineupsInjuryWarning}
                  </span>
                )}
                {player.benchRisk && (
                  <span className={styles.benchRiskBadge}>{copy.predictedLineupsBenchRisk}</span>
                )}
              </button>
            </td>
            <td className={styles.tableNum}>{player.xMins}</td>
            <td className={styles.tableXpts}>{player.xPts.toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

PredictedLineupTable.displayName = 'PredictedLineupTable';
