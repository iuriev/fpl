import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { IconChips } from '@/components/ui/icons/IconChips';
import { IconFixtures } from '@/components/ui/icons/IconFixtures';
import { IconManagersWL } from '@/components/ui/icons/IconManagersWL';
import { IconPlayersWL } from '@/components/ui/icons/IconPlayersWL';
import { IconPrices } from '@/components/ui/icons/IconPrices';
import { IconStats } from '@/components/ui/icons/IconStats';
import { IconTopPlayers } from '@/components/ui/icons/IconTopPlayers';

import styles from './NavMoreSheet.module.css';

export const NAV_MORE_SHEET_ID = 'nav-more-sheet';

const SWIPE_THRESHOLD_PX = 80;

const SHEET_ITEMS = [
  { abbr: 'STAT', label: 'Stats', route: '/stats', Icon: IconStats },
  { abbr: 'MWCH', label: 'Managers WL', route: '/watchlist', Icon: IconManagersWL },
  { abbr: 'PLWL', label: 'Players WL', route: '/player-watchlist', Icon: IconPlayersWL },
  { abbr: 'TOP', label: 'Top Players', route: '/top-players', Icon: IconTopPlayers },
  { abbr: 'PRCE', label: 'Prices', route: '/price-changes', Icon: IconPrices },
  { abbr: 'CHIP', label: 'Chips', route: '/chip-strategy', Icon: IconChips },
  { abbr: 'FIX', label: 'Fixtures', route: '/fixtures', Icon: IconFixtures },
] as const;

export function NavMoreSheet() {
  const navigate = useNavigate();
  const popoverRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const draggingRef = useRef(false);

  const close = () => {
    popoverRef.current?.hidePopover();
  };

  const handleItemClick = (route: string) => {
    navigate(route);
    close();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    draggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    if (deltaY > 0) {
      e.currentTarget.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const deltaY = e.changedTouches[0].clientY - startYRef.current;
    e.currentTarget.style.transform = '';
    if (deltaY >= SWIPE_THRESHOLD_PX) {
      close();
    }
  };

  return (
    <div
      ref={popoverRef}
      id={NAV_MORE_SHEET_ID}
      popover="auto"
      className={styles.sheet}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-label="More destinations"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.handle} aria-hidden="true" />
        <div className={styles.grid}>
          {SHEET_ITEMS.map(({ label, route, Icon }) => (
            <button
              key={route}
              type="button"
              className={styles.gridItem}
              onClick={() => handleItemClick(route)}
              aria-label={label}
            >
              <Icon size={30} />
              <span className={styles.gridLabel}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

NavMoreSheet.displayName = 'NavMoreSheet';
