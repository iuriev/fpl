import React, { useEffect, useMemo, useState } from 'react';

import { useGameweeks, usePredictedLineups } from '@/api/queries';
import { PlayerProfileSheet } from '@/components/ui/PlayerProfileSheet/PlayerProfileSheet';
import { PremiumLockedOverlay } from '@/components/ui/PremiumLockedOverlay/PremiumLockedOverlay';
import { PremiumSheet } from '@/components/ui/PremiumSheet/PremiumSheet';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy, interpolate } from '@/lib/copy';
import { useRequestPremiumUpsell } from '@/lib/premium-upsell/PremiumUpsellContext';
import { useFollowPlayer } from '@/lib/use-follow-player';
import { usePremiumStatus } from '@/lib/use-premium-status';

import { PredictedLineupPitch } from './PredictedLineupPitch';
import styles from './PredictedLineupsScreen.module.css';
import { PredictedLineupTable } from './PredictedLineupTable';

type ViewMode = 'table' | 'pitch';

export const PredictedLineupsScreen: React.FC = () => {
  const isPremium = usePremiumStatus();
  const requestUpsell = useRequestPremiumUpsell();
  const [view, setView] = useState<ViewMode>('pitch');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [profilePlayerId, setProfilePlayerId] = useState<number | null>(null);

  const { data: gameweeksData } = useGameweeks();
  const nextGw = gameweeksData?.next ?? gameweeksData?.current ?? null;
  const gwLabel =
    nextGw !== null ? interpolate(copy.predictedLineupsGwLabel, { n: nextGw }) : '';

  const lineupsQuery = usePredictedLineups(nextGw, isPremium);

  useEffect(() => {
    if (!isPremium) {
      requestUpsell('predictions');
    }
  }, [isPremium, requestUpsell]);

  const teams = useMemo(
    () => lineupsQuery.data?.teams ?? [],
    [lineupsQuery.data?.teams]
  );

  const defaultTeamId = useMemo(() => {
    if (teams.length === 0) return null;
    const sorted = [...teams].sort((a, b) => a.shortName.localeCompare(b.shortName));
    return sorted[0]?.teamId ?? null;
  }, [teams]);

  const resolvedTeamId = selectedTeamId ?? defaultTeamId;

  const activeTeam = teams.find((t) => t.teamId === resolvedTeamId) ?? teams[0];

  const { following, toggle: toggleFollow } = useFollowPlayer(profilePlayerId ?? 0);

  const fixtureLabel =
    activeTeam?.nextFixture != null
      ? interpolate(
          activeTeam.nextFixture.isHome
            ? copy.predictedLineupsVsHome
            : copy.predictedLineupsVsAway,
          { opponent: activeTeam.nextFixture.opponentShortName }
        )
      : null;

  return (
    <div className={styles.screen}>
      <ScreenHeader
        backLabel={copy.squadGuestBack}
        title={copy.predictedLineupsTitle}
        right={gwLabel ? <span className={styles.gwLabel}>{gwLabel}</span> : undefined}
      />

      {!isPremium && (
        <div className={styles.lockedWrap}>
          <PremiumLockedOverlay
            onUnlock={() => setPremiumOpen(true)}
            label={copy.predictedLineupsUnlockLabel}
          />
        </div>
      )}

      {isPremium && (
        <>
          <div className={styles.teamScroller} role="tablist" aria-label={copy.predictedLineupsTitle}>
            {teams.map((team) => (
              <button
                key={team.teamId}
                type="button"
                role="tab"
                aria-selected={team.teamId === resolvedTeamId}
                className={`${styles.teamChip} ${team.teamId === resolvedTeamId ? styles.teamChipActive : ''}`}
                onClick={() => setSelectedTeamId(team.teamId)}
              >
                {team.shortName}
              </button>
            ))}
          </div>

          {activeTeam && (
            <div className={styles.meta}>
              <span className={styles.formation}>
                {copy.predictedLineupsFormationLabel}: {activeTeam.formation.label}
              </span>
              {fixtureLabel && <span className={styles.fixture}>{fixtureLabel}</span>}
            </div>
          )}

          <div className={styles.viewToggle} role="tablist" aria-label="View">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'table'}
              className={`${styles.viewBtn} ${view === 'table' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('table')}
            >
              {copy.predictedLineupsTableView}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'pitch'}
              className={`${styles.viewBtn} ${view === 'pitch' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('pitch')}
            >
              {copy.predictedLineupsPitchView}
            </button>
          </div>

          <div className={styles.content}>
            {lineupsQuery.isLoading && (
              <div className={styles.skeletonBar} aria-busy="true" aria-label={copy.loadingPlaceholder} />
            )}

            {lineupsQuery.isError && (
              <div>
                <p className={styles.error}>{copy.predictedLineupsLoadError}</p>
                <button
                  type="button"
                  className={styles.retryBtn}
                  onClick={() => lineupsQuery.refetch()}
                >
                  {copy.predictedLineupsRetry}
                </button>
              </div>
            )}

            {activeTeam && !lineupsQuery.isLoading && !lineupsQuery.isError && (
              <>
                {activeTeam.players.length === 0 ? (
                  <p className={styles.empty}>{copy.predictedLineupsEmptyTeam}</p>
                ) : view === 'table' ? (
                  <PredictedLineupTable
                    players={activeTeam.players}
                    onSelect={setProfilePlayerId}
                  />
                ) : (
                  <PredictedLineupPitch
                    players={activeTeam.players}
                    teamShortName={activeTeam.shortName}
                    teamId={activeTeam.teamId}
                    onSelect={setProfilePlayerId}
                  />
                )}
              </>
            )}
          </div>
        </>
      )}

      <PremiumSheet
        open={premiumOpen}
        onClose={() => setPremiumOpen(false)}
        title={copy.predictedLineupsPremiumTitle}
        description={copy.predictedLineupsPremiumDescription}
        freeLabel={copy.predictedLineupsPremiumFreeLabel}
        premiumLabel={copy.predictedLineupsPremiumPremiumLabel}
      />

      <PlayerProfileSheet
        playerId={profilePlayerId}
        open={profilePlayerId != null}
        onClose={() => setProfilePlayerId(null)}
        onFollow={() => toggleFollow()}
        isFollowing={following}
      />
    </div>
  );
};

PredictedLineupsScreen.displayName = 'PredictedLineupsScreen';
