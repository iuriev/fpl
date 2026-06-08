import React, { useEffect, useRef } from 'react';

import { copy } from '@/lib/copy';

import styles from './Drawer.module.css';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  header?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

const SWIPE_THRESHOLD_PX = 80;

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  ariaLabel,
  header,
  headerActions,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
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
    startXRef.current = e.touches[0].clientX;
    draggingRef.current = true;
    if (panelRef.current) {
      panelRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggingRef.current || !panelRef.current) return;
    const deltaX = Math.min(0, e.touches[0].clientX - startXRef.current);
    panelRef.current.style.transform = `translateX(${deltaX}px)`;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!draggingRef.current || !panelRef.current) return;
    draggingRef.current = false;
    const deltaX = Math.min(0, e.changedTouches[0].clientX - startXRef.current);
    const drawerWidth = panelRef.current.offsetWidth;
    const threshold = Math.max(SWIPE_THRESHOLD_PX, drawerWidth * 0.35);

    panelRef.current.style.transition = '';
    panelRef.current.style.transform = '';

    if (Math.abs(deltaX) >= threshold) {
      onClose();
    }
  };

  return (
    <>
      <div
        className={`${styles.backdrop} ${open ? styles.backdropVisible : ''}`}
        aria-hidden="true"
        data-testid="drawer-backdrop"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={`${styles.panel} ${open ? styles.panelOpen : ''}`}
        role={open ? 'dialog' : undefined}
        aria-modal={open ? 'true' : undefined}
        aria-label={open ? ariaLabel : undefined}
        tabIndex={-1}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerHeaderContent}>{header}</div>
          {headerActions}
          <button className={styles.iconBtn} onClick={onClose} aria-label={copy.closeButton}>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </>
  );
};

Drawer.displayName = 'Drawer';
