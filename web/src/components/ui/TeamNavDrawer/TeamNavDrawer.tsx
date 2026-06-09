import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useEntry } from '@/api/queries';
import { Drawer } from '@/components/ui/Drawer/Drawer';
import drawerStyles from '@/components/ui/Drawer/Drawer.module.css';
import type { NavLinksMode } from '@/components/ui/TeamInfoPanel/TeamInfoPanel';
import { TeamInfoPanel, TeamInfoPanelSkeleton } from '@/components/ui/TeamInfoPanel/TeamInfoPanel';
import { copy } from '@/lib/copy';

import styles from './TeamNavDrawer.module.css';

export interface TeamNavDrawerProps {
  teamId: number;
  open: boolean;
  onClose: () => void;
  navLinksMode?: NavLinksMode;
  showFollow?: boolean;
}

export const TeamNavDrawer: React.FC<TeamNavDrawerProps> = ({
  teamId,
  open,
  onClose,
  navLinksMode = 'full',
  showFollow = false,
}) => {
  const navigate = useNavigate();
  const { data: entry, isError: entryIsError } = useEntry(teamId);

  const flag = entry?.regionIsoCode
    ? [...entry.regionIsoCode.toUpperCase()]
        .map((c) => String.fromCodePoint(c.codePointAt(0)! - 65 + 0x1f1e6))
        .join('')
    : null;

  const header = entry ? (
    <div className={styles.drawerHeader}>
      <div className={styles.teamNameRow}>
        <span className={styles.teamName}>{entry.teamName}</span>
        <span className={styles.teamManager}>
          {flag && <span aria-hidden="true">{flag} </span>}
          {entry.managerName}
        </span>
      </div>
      <div className={styles.teamIdRow}>
        <span className={styles.teamId}>{'ID · ' + teamId}</span>
      </div>
    </div>
  ) : null;

  const headerActions =
    navLinksMode !== 'hidden' ? (
      <button
        type="button"
        className={drawerStyles.iconBtn}
        onClick={() => {
          onClose();
          navigate('/settings');
        }}
        aria-label={copy.settingsOpen}
      >
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M15.9 12.4a1.2 1.2 0 0 0 .24 1.32l.04.04a1.47 1.47 0 0 1-1.04 2.51 1.47 1.47 0 0 1-1.04-.43l-.04-.04a1.2 1.2 0 0 0-1.32-.24 1.2 1.2 0 0 0-.73 1.1v.12a1.47 1.47 0 0 1-2.94 0v-.06a1.2 1.2 0 0 0-.79-1.1 1.2 1.2 0 0 0-1.32.24l-.04.04a1.47 1.47 0 0 1-2.08-2.08l.04-.04a1.2 1.2 0 0 0 .24-1.32 1.2 1.2 0 0 0-1.1-.73h-.12a1.47 1.47 0 0 1 0-2.94h.06a1.2 1.2 0 0 0 1.1-.79 1.2 1.2 0 0 0-.24-1.32l-.04-.04a1.47 1.47 0 0 1 2.08-2.08l.04.04a1.2 1.2 0 0 0 1.32.24h.06a1.2 1.2 0 0 0 1.1-.79 1.47 1.47 0 0 1 2.94 0v.06a1.2 1.2 0 0 0 .73 1.1 1.2 1.2 0 0 0 1.32-.24l.04-.04a1.47 1.47 0 0 1 2.08 2.08l-.04.04a1.2 1.2 0 0 0-.24 1.32v.06a1.2 1.2 0 0 0 1.1.73h.12a1.47 1.47 0 0 1 0 2.94h-.12a1.2 1.2 0 0 0-1.1.73Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    ) : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      ariaLabel={copy.teamInfoDrawerLabel}
      header={header}
      headerActions={headerActions}
    >
      {entry ? (
        <TeamInfoPanel
          entry={entry}
          teamId={teamId}
          showFollow={showFollow}
          navLinksMode={navLinksMode}
          onClose={onClose}
        />
      ) : (
        !entryIsError && <TeamInfoPanelSkeleton />
      )}
    </Drawer>
  );
};

TeamNavDrawer.displayName = 'TeamNavDrawer';
