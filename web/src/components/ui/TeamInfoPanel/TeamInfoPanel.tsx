import React, { useEffect, useState } from 'react';

import { DonationBanner } from '@/components/ui/DonationBanner/DonationBanner';
import { copy, interpolate } from '@/lib/copy';
import { readDonationUrl } from '@/lib/donation/readDonationUrl';
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
  onClose?: () => void;
}

export const TeamInfoPanel: React.FC<TeamInfoPanelProps> = ({
  entry,
  teamId,
  showFollow = false,
}) => {
  const repo = useWatchlistRepository();
  const [following, setFollowing] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

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
      <div className={styles.panelBody}>
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
      </div>

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
      </div>

      {readDonationUrl() && (
        <div className={styles.donationWrap}>
          <DonationBanner />
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
    <div className={styles.panelBody}>
      <div className={styles.stats} aria-hidden="true">
        <div className={styles.skeletonStat} />
        <div className={styles.skeletonStat} />
        <div className={styles.skeletonStat} />
        <div className={styles.skeletonStat} />
      </div>
    </div>

    {readDonationUrl() && (
      <div className={styles.donationWrap} aria-hidden="true">
        <DonationBanner />
      </div>
    )}
  </aside>
);

TeamInfoPanelSkeleton.displayName = 'TeamInfoPanelSkeleton';
