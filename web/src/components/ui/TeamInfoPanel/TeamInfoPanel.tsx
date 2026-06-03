import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authClient } from '@/auth/auth-client';
import { useCurrentUser } from '@/auth/AuthContext';
import { DemoSignInDialog } from '@/components/ui/DemoSignInDialog/DemoSignInDialog';
import { copy, interpolate } from '@/lib/copy';
import { useWatchlistRepository } from '@/lib/watchlist-repository';
import type { EntryResponse } from '@/types';

import styles from './TeamInfoPanel.module.css';

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
  const navigate = useNavigate();
  const { user, refetch } = useCurrentUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      await refetch();
      navigate('/', { replace: true });
    } catch {
      setIsSigningOut(false);
    }
  };

  const handleChangeTeam = () => {
    navigate('/entry');
  };

  const userInitial = user ? (user.name || user.email).charAt(0).toUpperCase() : '';

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
      {navLinksMode === 'full' && user && (
        <>
          <div className={styles.userBlock}>
            <div className={styles.userAvatar}>{userInitial}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.name || user.email}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
            <button
              className={styles.signOutBtn}
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {copy.drawerSignOut}
            </button>
          </div>
          <button className={styles.changeTeamRow} onClick={handleChangeTeam}>
            {copy.drawerChangeTeam}
          </button>
        </>
      )}

      <DemoSignInDialog open={demoGateOpen} onClose={() => setDemoGateOpen(false)} />

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
