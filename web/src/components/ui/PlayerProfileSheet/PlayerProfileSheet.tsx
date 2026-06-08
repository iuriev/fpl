import React from 'react';

import { usePlayerProfile } from '@/api/queries';
import { BottomSheet } from '@/components/ui/BottomSheet/BottomSheet';
import { FdrChip } from '@/components/ui/FdrChip/FdrChip';
import { copy, interpolate } from '@/lib/copy';
import { formatPriceTenths } from '@/lib/format-price';
import { buildPredictionBlurb } from '@/lib/prediction-blurb';
import { profileStatLabel } from '@/lib/profile-stat-label';
import { chipColorKey } from '@/lib/stat-chips';
import type { PlayerGameweekPrediction,PlayerProfileLineupAlerts, PlayerProfileResponse } from '@/types';

import { buildAvailabilityAlerts } from './player-profile-alerts';
import styles from './PlayerProfileSheet.module.css';

export interface PlayerProfileSheetProps {
  playerId: number | null;
  open: boolean;
  onClose: () => void;
  onFollow?: (fplCode: number) => void;
  isFollowing?: boolean;
  lineupAlerts?: PlayerProfileLineupAlerts;
  prediction?: PlayerGameweekPrediction;
  profileVariant?: 'full' | 'summary';
  hidePastGameweek?: boolean;
  predictionsContext?: boolean;
  lineupPlayerName?: string;
}

const EMPTY_PROFILE_PLAYER: PlayerProfileResponse['player'] = {
  id: 0,
  fplCode: 0,
  webName: '',
  position: 'MID',
  teamCode: 0,
  teamShortName: '',
  nowCost: 0,
  selectedByPercent: '0',
  status: 'a',
  news: '',
};

function ProfileBody({
  data,
  onFollow,
  isFollowing,
  lineupAlerts,
  prediction,
  profileVariant = 'full',
  hidePastGameweek = false,
  predictionsContext = false,
}: {
  data?: PlayerProfileResponse;
  onFollow?: (fplCode: number) => void;
  isFollowing?: boolean;
  lineupAlerts?: PlayerProfileLineupAlerts;
  prediction?: PlayerGameweekPrediction;
  profileVariant?: 'full' | 'summary';
  hidePastGameweek?: boolean;
  predictionsContext?: boolean;
}) {
  const player = data?.player;
  const gw = data?.gw ?? null;
  const gwPoints = data?.gwPoints ?? null;
  const gwStats = data?.gwStats ?? [];
  const nextFixtures = data?.nextFixtures ?? [];
  const availabilityAlerts = buildAvailabilityAlerts(player ?? EMPTY_PROFILE_PLAYER, lineupAlerts);
  const isSummary = profileVariant === 'summary' || predictionsContext;
  const showPastGameweek = !isSummary && !hidePastGameweek;

  return (
    <>
      {player && (
        <div className={styles.headerMeta}>
          <span className={styles.metaLine}>
            {formatPriceTenths(player.nowCost)} · {player.selectedByPercent}% · {player.position} /{' '}
            {player.teamShortName}
          </span>
          {onFollow && (
            <button
              type="button"
              className={`${styles.followBtn} ${isFollowing ? styles.followBtnActive : ''}`}
              onClick={() => onFollow(player.fplCode)}
              aria-label={isFollowing ? copy.playerWatchlistUnfollow : copy.playerWatchlistFollow}
              aria-pressed={isFollowing}
            >
              {isFollowing ? '★' : '☆'}
            </button>
          )}
        </div>
      )}

      {!isSummary && prediction && player && (
        <p className={styles.predictionBlurb}>
          {buildPredictionBlurb(prediction, player.position, nextFixtures[0])}
        </p>
      )}

      {availabilityAlerts.length > 0 && (
        <div className={styles.alertBlock} role="status">
          {availabilityAlerts.map((line) => (
            <p
              key={line.key}
              className={`${styles.alertLine} ${styles[`alertLine_${line.variant}`]}`}
            >
              {line.text}
            </p>
          ))}
        </div>
      )}

      {showPastGameweek && gw != null && gwPoints != null && (
        <p className={styles.gwHeading}>
          {interpolate(copy.priceChangesProfileGw, { n: gw, pts: gwPoints })}
        </p>
      )}

      {showPastGameweek && gwStats.length > 0 && (
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

      {!isSummary && nextFixtures.length > 0 && (
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
  lineupAlerts,
  prediction,
  profileVariant = 'full',
  hidePastGameweek = false,
  predictionsContext = false,
  lineupPlayerName,
}) => {
  const { data, isLoading, isError } = usePlayerProfile(open ? playerId : null);

  const profile = open ? data : undefined;
  const title = profile?.player.webName ?? lineupPlayerName ?? copy.playerInfoOpen;
  const isSummary = profileVariant === 'summary' || predictionsContext;
  const canRenderSummary = open && isSummary && lineupAlerts != null;
  const showBody = open && (data != null || canRenderSummary);

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      {isLoading && !showBody && <p className={styles.status}>{copy.loadingPlaceholder}</p>}
      {isError && !showBody && <p className={styles.status}>{copy.priceChangesLoadError}</p>}
      {showBody && (
        <ProfileBody
          data={profile}
          onFollow={onFollow}
          isFollowing={isFollowing}
          lineupAlerts={lineupAlerts}
          prediction={prediction}
          profileVariant={profileVariant}
          hidePastGameweek={hidePastGameweek || predictionsContext}
          predictionsContext={predictionsContext}
        />
      )}
    </BottomSheet>
  );
};

PlayerProfileSheet.displayName = 'PlayerProfileSheet';
