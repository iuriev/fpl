import { NavLink, useLocation } from 'react-router-dom';

import { IconHome } from '@/components/ui/icons/IconHome';
import { IconMore } from '@/components/ui/icons/IconMore';
import { IconPredict } from '@/components/ui/icons/IconPredict';
import { IconReview } from '@/components/ui/icons/IconReview';
import { IconTransfers } from '@/components/ui/icons/IconTransfers';

import styles from './BottomNav.module.css';

const NAV_MORE_SHEET_ID = 'nav-more-sheet';

export function BottomNav() {
  const location = useLocation();

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <NavLink
        to="/"
        end
        className={`${styles.item} ${isActive('/', true) ? styles.active : ''}`}
        aria-current={isActive('/', true) ? 'page' : undefined}
      >
        <span className={styles.iconWrap}>
          <IconHome />
        </span>
        <span className={styles.label}>Home</span>
      </NavLink>

      <NavLink
        to="/transfers"
        className={`${styles.item} ${isActive('/transfers') ? styles.active : ''}`}
        aria-current={isActive('/transfers') ? 'page' : undefined}
      >
        <span className={styles.iconWrap}>
          <IconTransfers />
        </span>
        <span className={styles.label}>Transfers</span>
      </NavLink>

      <NavLink
        to="/predictions"
        className={`${styles.item} ${isActive('/predictions') ? styles.active : ''}`}
        aria-current={isActive('/predictions') ? 'page' : undefined}
      >
        <span className={styles.iconWrap}>
          <IconPredict />
        </span>
        <span className={styles.label}>Predict</span>
      </NavLink>

      <NavLink
        to="/review"
        className={`${styles.item} ${isActive('/review') ? styles.active : ''}`}
        aria-current={isActive('/review') ? 'page' : undefined}
      >
        <span className={styles.iconWrap}>
          <IconReview />
        </span>
        <span className={styles.label}>Review</span>
      </NavLink>

      <button
        type="button"
        className={styles.item}
        popoverTarget={NAV_MORE_SHEET_ID}
        aria-haspopup="dialog"
        aria-label="More"
      >
        <span className={styles.iconWrap}>
          <IconMore />
        </span>
        <span className={styles.label}>More</span>
      </button>
    </nav>
  );
}

BottomNav.displayName = 'BottomNav';
