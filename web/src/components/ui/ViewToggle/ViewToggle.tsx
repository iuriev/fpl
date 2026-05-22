import React from 'react';

import { copy } from '@/lib/copy';

import styles from './ViewToggle.module.css';

export type ViewMode = 'pitch' | 'list';

export interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ value, onChange }) => {
  return (
    <div role="group" aria-label={copy.viewToggleLabel} className={styles.toggle}>
      <button
        className={`${styles.option} ${value === 'pitch' ? styles.option_active : ''}`}
        aria-pressed={value === 'pitch'}
        onClick={() => onChange('pitch')}
      >
        {copy.viewPitch}
      </button>
      <button
        className={`${styles.option} ${value === 'list' ? styles.option_active : ''}`}
        aria-pressed={value === 'list'}
        onClick={() => onChange('list')}
      >
        {copy.viewList}
      </button>
    </div>
  );
};

ViewToggle.displayName = 'ViewToggle';
