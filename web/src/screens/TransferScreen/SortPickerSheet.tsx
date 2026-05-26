import React, { useEffect } from 'react';

import { copy } from '@/lib/copy';

import styles from './SortPickerSheet.module.css';

export type SortKey = 'totalPoints' | 'nowCost' | 'form' | 'eventPoints' | 'selectedByPercent';

export const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'totalPoints',       label: copy.transfersSortPts },
  { key: 'nowCost',           label: copy.transfersSortPrice },
  { key: 'form',              label: copy.transfersSortForm },
  { key: 'eventPoints',       label: copy.transfersSortGwPts },
  { key: 'selectedByPercent', label: copy.transfersSortSel },
];

export interface SortPickerSheetProps {
  open: boolean;
  sortKey: SortKey;
  onSelect: (key: SortKey) => void;
  onClose: () => void;
}

export const SortPickerSheet: React.FC<SortPickerSheetProps> = ({
  open,
  sortKey,
  onSelect,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`${styles.backdrop} ${open ? styles.backdropVisible : ''}`}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className={`${styles.panel} ${open ? styles.panelOpen : ''}`}
        role={open ? 'dialog' : undefined}
        aria-modal={open ? 'true' : undefined}
        aria-label="Sort by"
        aria-hidden={open ? undefined : 'true'}
      >
        <div className={styles.handle} aria-hidden="true" />
        <ul className={styles.list} role="listbox" aria-label="Sort options">
          {SORT_OPTIONS.map((opt) => (
            <li
              key={opt.key}
              className={`${styles.option} ${sortKey === opt.key ? styles.option_active : ''}`}
              role="option"
              aria-selected={sortKey === opt.key}
              tabIndex={open ? 0 : -1}
              onClick={() => onSelect(opt.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(opt.key); }
              }}
            >
              <span className={styles.optionLabel}>{opt.label}</span>
              {sortKey === opt.key && <span className={styles.checkmark} aria-hidden="true">✓</span>}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

SortPickerSheet.displayName = 'SortPickerSheet';
