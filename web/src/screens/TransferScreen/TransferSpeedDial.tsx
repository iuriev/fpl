import React, { useCallback, useEffect, useRef, useState } from 'react';

import { copy } from '@/lib/copy';
import { useRequestPremiumUpsell } from '@/lib/premium-upsell/PremiumUpsellContext';
import { usePremiumStatus } from '@/lib/use-premium-status';

import styles from './TransferSpeedDial.module.css';

const AI_GATES_ENABLED = import.meta.env.VITE_AI_FREEHIT_GATES_ENABLED === 'true';

export interface TransferSpeedDialProps {
  onOpenTransfers: () => void;
  onReset: () => void;
  onSave: () => void;
  onAiFreeHit: () => void;
  hasSwaps: boolean;
  hasChanges: boolean;
  isDirty: boolean;
  isAiLoading: boolean;
  freehitAvailable: boolean;
}

function IconSwapArrows() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8h13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M13 5l4 3-4 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16H7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M11 13l-4 3 4 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUndo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h10a5 5 0 0 1 0 10H9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M7 4l-3 3 3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v11m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconLightning() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export const TransferSpeedDial: React.FC<TransferSpeedDialProps> = ({
  onOpenTransfers,
  onReset,
  onSave,
  onAiFreeHit,
  hasSwaps,
  hasChanges,
  isDirty,
  isAiLoading,
  freehitAvailable,
}) => {
  const [open, setOpen] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);
  const isPremium = usePremiumStatus();
  const requestPremiumUpsell = useRequestPremiumUpsell();

  const close = useCallback(() => setOpen(false), []);

  const handleAiFreeHit = () => {
    if (AI_GATES_ENABLED && !isPremium) {
      requestPremiumUpsell('transfer');
      close();
      return;
    }
    onAiFreeHit();
    close();
  };

  const aiFreehitDisabled = isAiLoading || (AI_GATES_ENABLED && !freehitAvailable);
  const aiFreehitTitle = AI_GATES_ENABLED && !freehitAvailable ? copy.aiFreehitPlayed : undefined;

  const items = [
    {
      id: 'transfers',
      label: copy.transfersTitle,
      icon: <IconSwapArrows />,
      onClick: () => { onOpenTransfers(); close(); },
      disabled: !hasSwaps,
    },
    {
      id: 'reset',
      label: copy.transfersReset,
      icon: <IconUndo />,
      onClick: () => { onReset(); close(); },
      disabled: !hasChanges,
    },
    {
      id: 'save',
      label: copy.transfersSavePlan,
      icon: <IconSave />,
      onClick: () => { onSave(); close(); },
      disabled: !isDirty || !hasChanges,
    },
    {
      id: 'freehit',
      label: isAiLoading ? '…' : copy.aiFreehitButton,
      icon: <IconLightning />,
      onClick: handleAiFreeHit,
      disabled: aiFreehitDisabled,
      title: aiFreehitTitle,
    },
    {
      id: 'wildcard',
      label: copy.aiWildcardButton,
      icon: <IconSparkle />,
      onClick: () => { close(); },
      disabled: true,
      title: 'Coming soon',
    },
  ];

  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      if (dialRef.current && !dialRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open, close]);

  return (
    <div
      ref={dialRef}
      className={styles.dial}
      data-open={open || undefined}
      data-tour="step-9"
    >
      <div className={styles.itemsBackdrop}>
        {items.map((item, i) => (
          <div
            key={item.id}
            className={styles.itemRow}
            style={{ '--stagger': i } as React.CSSProperties}
          >
            <button
              type="button"
              className={styles.itemBtn}
              onClick={item.onClick}
              disabled={item.disabled}
              title={item.title}
              aria-label={item.label}
            >
              <span className={styles.itemLabel}>{item.label}</span>
              <span className={styles.itemIcon}>{item.icon}</span>
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close actions' : 'Open actions'}
        aria-expanded={open}
      >
        <span className={styles.fabCross} aria-hidden="true" />
      </button>
    </div>
  );
};

TransferSpeedDial.displayName = 'TransferSpeedDial';
