import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { DemoSignInDialog } from '@/components/ui/DemoSignInDialog/DemoSignInDialog';
import { copy, interpolate } from '@/lib/copy';
import { useWatchlistRepository } from '@/lib/watchlist-repository';
import type { EntryResponse } from '@/types';

import styles from './TeamInfoPanel.module.css';

function isoToFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.codePointAt(0)! - 65 + 0x1f1e6))
    .join('');
}

function fmt(n: number): string {
  return n.toLocaleString('en-GB');
}

export type NavLinksMode = 'full' | 'hidden' | 'demo';

export interface TeamInfoPanelProps {
  entry: EntryResponse;
  teamId: number;
  showFollow?: boolean;
  navLinksMode?: NavLinksMode;
}

const NAV_LINKS: { to: string; label: () => string; featured?: boolean }[] = [
  { to: '/history', label: () => copy.teamInfoGwHistory },
  { to: '/review', label: () => copy.reviewNavLink },
  { to: '/stats', label: () => copy.statsMyStats },
  { to: '/team-of-the-week', label: () => copy.teamOfTheWeekNavLink },
  { to: '/top-players', label: () => copy.topPlayersNavLink },
  { to: '/watchlist', label: () => copy.watchlistNavLink },
  { to: '/player-watchlist', label: () => copy.playerWatchlistNavLink },
  { to: '/transfers', label: () => copy.transfersNavLink, featured: true },
];

export const TeamInfoPanel: React.FC<TeamInfoPanelProps> = ({
  entry,
  teamId,
  showFollow = false,
  navLinksMode = 'full',
}) => {
  const flag = entry.regionIsoCode ? isoToFlag(entry.regionIsoCode) : null;
  const repo = useWatchlistRepository();
  const [following, setFollowing] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [demoGateOpen, setDemoGateOpen] = useState(false);
  const openDemoGate = useCallback(() => setDemoGateOpen(true), []);

  useEffect(() => {
    if (!showFollow) return;
    repo.has(teamId).then(setFollowing);
  }, [repo, teamId, showFollow]);

  const handleFollow = async () => {
    if (following) {
      await repo.remove(teamId);
      setFollowing(false);
      setLimitReached(false);
    } else {
      const result = await repo.add(teamId);
      if (result === 'ok') {
        setFollowing(true);
        setLimitReached(false);
      } else if (result === 'limit') {
        setLimitReached(true);
      }
    }
  };

  return (
    <aside className={styles.panel}>
      <DemoSignInDialog open={demoGateOpen} onClose={() => setDemoGateOpen(false)} />

      <div className={styles.avatarWrap} aria-hidden="true">
        <div className={styles.avatar} />
      </div>

      <div className={styles.identity}>
        <span className={styles.teamName}>{entry.teamName}</span>
        <span className={styles.manager}>
          {flag && <span aria-hidden="true">{flag} </span>}
          {entry.managerName}
        </span>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{fmt(entry.overallPoints)}</span>
          <span className={styles.statLabel}>{copy.teamInfoOverallPts}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{fmt(entry.overallRank)}</span>
          <span className={styles.statLabel}>{copy.teamInfoOverallRank}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{fmt(entry.eventPoints)}</span>
          <span className={styles.statLabel}>{copy.teamInfoGwPts}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{fmt(entry.totalPlayers)}</span>
          <span className={styles.statLabel}>{copy.teamInfoTotalPlayers}</span>
        </div>
      </div>

      {navLinksMode === 'full' && (
        <div className={styles.navLinks}>
          {NAV_LINKS.map(({ to, label, featured }) => (
            <Link
              key={to}
              to={to}
              className={`${styles.navLink}${featured ? ` ${styles.navLinkFeatured}` : ''}`}
            >
              {label()}
            </Link>
          ))}
        </div>
      )}

      {navLinksMode === 'demo' && (
        <div className={styles.navLinks}>
          {NAV_LINKS.map(({ to, label, featured }) => (
            <button
              key={to}
              type="button"
              className={`${styles.navLink} ${styles.navLinkDemo}${featured ? ` ${styles.navLinkFeatured}` : ''}`}
              onClick={openDemoGate}
            >
              {label()}
            </button>
          ))}
        </div>
      )}

      {showFollow && (
        <div className={styles.followWrap}>
          {limitReached && (
            <p className={styles.followLimit}>
              {interpolate(copy.watchlistFollowLimitToast, { max: repo.getLimit() })}
            </p>
          )}
          <button
            className={`${styles.followBtn} ${following ? styles.followingBtn : ''}`}
            onClick={handleFollow}
            aria-pressed={following}
          >
            {following ? copy.watchlistUnfollowButton : copy.watchlistFollowButton}
          </button>
        </div>
      )}
    </aside>
  );
};

TeamInfoPanel.displayName = 'TeamInfoPanel';

export const TeamInfoPanelSkeleton: React.FC = () => (
  <aside
    className={styles.panel}
    aria-busy="true"
    aria-label={copy.loadingPlaceholder}
  >
    <div className={styles.avatarWrap} aria-hidden="true">
      <div className={styles.skeletonAvatar} />
    </div>

    <div className={styles.identity} aria-hidden="true">
      <div className={styles.skeletonBar} />
      <div className={styles.skeletonBarShort} />
    </div>

    <div className={styles.stats} aria-hidden="true">
      <div className={styles.skeletonStat} />
      <div className={styles.skeletonStat} />
      <div className={styles.skeletonStat} />
      <div className={styles.skeletonStat} />
    </div>

    <div className={styles.navLinks} aria-hidden="true">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className={styles.skeletonNavBar} />
      ))}
    </div>
  </aside>
);

TeamInfoPanelSkeleton.displayName = 'TeamInfoPanelSkeleton';
