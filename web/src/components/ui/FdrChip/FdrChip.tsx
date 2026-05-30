import React from 'react';

import styles from './FdrChip.module.css';

export interface FdrChipProps {
  opponent: string;
  home: boolean;
  difficulty: 1 | 2 | 3 | 4 | 5;
  'data-tour'?: string;
}

export const FdrChip: React.FC<FdrChipProps> = ({ opponent, home, difficulty, 'data-tour': dataTour }) => (
  <span
    className={`${styles.chip} ${styles[`chip_d${difficulty}`]}`}
    data-difficulty={String(difficulty)}
    title={`${opponent} (${home ? 'H' : 'A'})`}
    data-tour={dataTour}
  >
    {opponent}&nbsp;{home ? 'H' : 'A'}
  </span>
);

FdrChip.displayName = 'FdrChip';
