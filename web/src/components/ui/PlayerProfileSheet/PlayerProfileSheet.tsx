import React from 'react';

import { usePlayerProfile } from '@/api/queries';
import { BottomSheet } from '@/components/ui/BottomSheet/BottomSheet';
import { FdrChip } from '@/components/ui/FdrChip/FdrChip';
import { copy, interpolate } from '@/lib/copy';
import { formatPriceTenths } from '@/lib/format-price';
import { profileStatLabel } from '@/lib/profile-stat-label';
import { chipColorKey } from '@/lib/stat-chips';
import type { PlayerProfileResponse } from '@/types';

import styles from './PlayerProfileSheet.module.css';

export interface PlayerProfileSheetProps {
  playerId: number | null;
  open: boolean;
  onClose: () => void;
  onFollow?: (playerId: number) => void;
  isFollowing?: boolean;
}

function ProfileBody({
  data,
  onFollow,
  isFollowing,
}: {
  data: PlayerProfileResponse;
  onFollow?: (playerId: number) => void;
  isFollowing?: boolean;
}) {
  const { player, gw, gwPoints, gwStats, nextFixtures } = data;

  return (
    <>
      <div className={styles.headerMeta}>
        <span className={styles.metaLine}>
          {formatPriceTenths(player.nowCost)} · {player.selectedByPercent}% · {player.position} /{' '}
          {player.teamShortName}
        </span>
        {onFollow && (
          <button
            type="button"
            className={`${styles.followBtn} ${isFollowing ? styles.followBtnActive : ''}`}
            onClick={() => onFollow(player.id)}
            aria-label={isFollowing ? copy.playerWatchlistUnfollow : copy.playerWatchlistFollow}
            aria-pressed={isFollowing}
          >
            {isFollowing ? '★' : '☆'}
          </button>
        )}
      </div>

      {gw != null && gwPoints != null && (
        <p className={styles.gwHeading}>
          {interpolate(copy.priceChangesProfileGw, { n: gw, pts: gwPoints })}
        </p>
      )}

      {gwStats.length > 0 && (
        <div className={styles.statChips}>
          {gwStats.map((s) => (
            <span
              key={s.identifier}
              className={`${styles.chip} ${styles[chipColorKey(s.identifier) as keyof typeof styles] ?? styles.chipDefault}`}
            >
              {profileStatLabel(s.identifier, s.value)}
            </span>
          ))}
        </div>
      )}

      {nextFixtures.length > 0 && (
        <>
          <span className={styles.sectionLabel}>{copy.playerInfoUpcomingFixtures}</span>
          {nextFixtures.slice(0, 5).map((f) => (
            <div key={`${f.gw}-${f.opponent}`} className={styles.fixtureRow}>
              <span className={styles.gwNum}>GW{f.gw}</span>
              <FdrChip opponent={f.opponent} home={f.home} difficulty={f.difficulty} />
            </div>
          ))}
        </>
      )}
    </>
  );
}

export const PlayerProfileSheet: React.FC<PlayerProfileSheetProps> = ({
  playerId,
  open,
  onClose,
  onFollow,
  isFollowing = false,
}) => {
  const { data, isLoading, isError } = usePlayerProfile(open ? playerId : null);

  const title = data?.player.webName ?? copy.playerInfoOpen;

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      {isLoading && <p className={styles.status}>{copy.loadingPlaceholder}</p>}
      {isError && <p className={styles.status}>{copy.priceChangesLoadError}</p>}
      {data && <ProfileBody data={data} onFollow={onFollow} isFollowing={isFollowing} />}
    </BottomSheet>
  );
};

PlayerProfileSheet.displayName = 'PlayerProfileSheet';
