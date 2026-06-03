import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { NavLinksMode } from '@/components/ui/TeamInfoPanel/TeamInfoPanel';
import { TeamNavDrawer } from '@/components/ui/TeamNavDrawer/TeamNavDrawer';
import { copy } from '@/lib/copy';
import { MyTeamContext } from '@/lib/my-team/MyTeamContext';

import styles from './ScreenHeader.module.css';

export interface ScreenHeaderProps {
  title: string;
  teamId?: number | null;
  navLinksMode?: NavLinksMode;
  showFollow?: boolean;
  backTo?: string;
  backLabel?: string;
  right?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  teamId: teamIdProp,
  navLinksMode: navLinksModeProp,
  showFollow = false,
  backTo,
  backLabel = copy.squadGuestBack,
  right,
}) => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const myTeam = useContext(MyTeamContext);
  const teamId = teamIdProp ?? myTeam?.myTeamId ?? null;
  const navLinksMode = navLinksModeProp ?? (myTeam?.isDemoMode ? 'demo' : 'full');

  return (
    <>
      {teamId !== null && !backTo && (
        <TeamNavDrawer
          teamId={teamId}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          navLinksMode={navLinksMode}
          showFollow={showFollow}
        />
      )}

      <header className={styles.header}>
        {backTo ? (
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate(backTo)}
            aria-label={backLabel}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M10 4l-4 4 4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {backLabel}
          </button>
        ) : (
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setDrawerOpen(true)}
            aria-label={copy.teamInfoOpenDrawer}
            disabled={teamId === null}
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        <div className={styles.heading}>
          <span className={styles.title}>{title}</span>
        </div>

        <div className={styles.right}>{right}</div>
      </header>
    </>
  );
};

ScreenHeader.displayName = 'ScreenHeader';
