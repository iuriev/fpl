import React, { useMemo } from 'react';

import { useEntry } from '@/api/queries';
import { Drawer } from '@/components/ui/Drawer/Drawer';
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
  const { data: entry, isError: entryIsError } = useEntry(teamId);

  const flag = useMemo(() => {
    if (!entry?.regionIsoCode) return null;
    return [...entry.regionIsoCode.toUpperCase()]
      .map((c) => String.fromCodePoint(c.codePointAt(0)! - 65 + 0x1f1e6))
      .join('');
  }, [entry?.regionIsoCode]);

  const header = entry ? (
    <div className={styles.drawerHeader}>
      <div className={styles.teamNameRow}>
        <span className={styles.teamName}>{entry.teamName}</span>
        <span className={styles.teamManager}>
          {flag && <span aria-hidden="true">{flag} </span>}
          {entry.managerName}
        </span>
      </div>
      <span className={styles.teamId}>{'ID · ' + teamId}</span>
    </div>
  ) : null;

  return (
    <Drawer open={open} onClose={onClose} ariaLabel={copy.teamInfoDrawerLabel} header={header}>
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
