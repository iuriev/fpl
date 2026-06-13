import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import { BottomNav } from '@/components/ui/BottomNav/BottomNav';
import { NavMoreSheet } from '@/components/ui/NavMoreSheet/NavMoreSheet';

import styles from './AppLayout.module.css';

const COMPACT_THRESHOLD_PX = 60;

export function AppLayout() {
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handler = () => {
      const y = window.scrollY;
      const scrollingDown = y > lastScrollY;

      if (scrollingDown && y > COMPACT_THRESHOLD_PX) {
        document.body.setAttribute('data-compact', '');
      } else if (!scrollingDown) {
        document.body.removeAttribute('data-compact');
      }

      lastScrollY = y;
    };

    window.addEventListener('scroll', handler, { passive: true });

    return () => {
      window.removeEventListener('scroll', handler);
      document.body.removeAttribute('data-compact');
    };
  }, []);

  return (
    <div className={styles.layout}>
      <Outlet />
      <BottomNav />
      <NavMoreSheet />
    </div>
  );
}

AppLayout.displayName = 'AppLayout';
