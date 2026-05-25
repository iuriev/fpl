import React, { useEffect, useRef } from 'react';

import { copy } from '@/lib/copy';

import styles from './BottomSheet.module.css';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const SWIPE_THRESHOLD_PX = 60;

export const BottomSheet: React.FC<BottomSheetProps> = ({ open, onClose, title, children }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    draggingRef.current = true;
    if (panelRef.current) {
      panelRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggingRef.current || !panelRef.current) return;
    const deltaY = Math.max(0, e.touches[0].clientY - startYRef.current);
    panelRef.current.style.transform = `translateY(${deltaY}px)`;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!draggingRef.current || !panelRef.current) return;
    draggingRef.current = false;
    const deltaY = Math.max(0, e.changedTouches[0].clientY - startYRef.current);

    panelRef.current.style.transition = '';
    panelRef.current.style.transform = '';

    if (deltaY >= SWIPE_THRESHOLD_PX) {
      onClose();
    }
  };

  return (
    <>
      <div
        className={`${styles.backdrop} ${open ? styles.backdropVisible : ''}`}
        aria-hidden="true"
        data-testid="bottom-sheet-backdrop"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={`${styles.panel} ${open ? styles.panelOpen : ''}`}
        role={open ? 'dialog' : undefined}
        aria-modal={open ? 'true' : undefined}
        aria-label={open ? title : undefined}
        aria-hidden={open ? undefined : 'true'}
        tabIndex={-1}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.handle} aria-hidden="true" />
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label={copy.closeButton}>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </>
  );
};

BottomSheet.displayName = 'BottomSheet';
