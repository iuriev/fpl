import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useGameweeks, usePredictedLineups } from '@/api/queries';
import { BottomSheet } from '@/components/ui/BottomSheet/BottomSheet';
import { PremiumLockedOverlay } from '@/components/ui/PremiumLockedOverlay/PremiumLockedOverlay';
import { PremiumSheet } from '@/components/ui/PremiumSheet/PremiumSheet';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy, interpolate } from '@/lib/copy';
import { useRequestPremiumUpsell } from '@/lib/premium-upsell/PremiumUpsellContext';
import { usePremiumStatus } from '@/lib/use-premium-status';
import { MAX_GAMEWEEK } from '@/types';

import { PredictedLineupPitch } from './PredictedLineupPitch';
import styles from './PredictedLineupsScreen.module.css';
import { PredictedLineupTable } from './PredictedLineupTable';

type ViewMode = 'table' | 'pitch';

export const PredictedLineupsScreen: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isPremium = usePremiumStatus();
  const requestUpsell = useRequestPremiumUpsell();
  const [view, setView] = useState<ViewMode>('pitch');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [gwPickerOpen, setGwPickerOpen] = useState(false);

  const { data: gameweeksData } = useGameweeks();
  const defaultGw = gameweeksData?.next ?? gameweeksData?.current ?? null;

  const selectableGws = useMemo(() => {
    const current = gameweeksData?.current;
    const next = gameweeksData?.next ?? gameweeksData?.current;
    if (current == null || next == null) return [];
    const low = Math.min(current, next);
    const high = Math.max(current, next);
    return Array.from({ length: high - low + 1 }, (_, i) => low + i);
  }, [gameweeksData]);

  const gwParam = searchParams.get('gw');
  const selectedGw = useMemo(() => {
    if (gwParam) {
      const n = Number(gwParam);
      if (Number.isInteger(n) && n >= 1 && n <= MAX_GAMEWEEK) {
        if (selectableGws.length === 0 || selectableGws.includes(n)) return n;
      }
    }
    return defaultGw;
  }, [gwParam, defaultGw, selectableGws]);

  const gwLabel =
    selectedGw !== null ? interpolate(copy.predictedLineupsGwLabel, { n: selectedGw }) : '';

  const selectGw = (gw: number) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('gw', String(gw));
      return p;
    });
    setGwPickerOpen(false);
  };

  const lineupsQuery = usePredictedLineups(selectedGw, isPremium);

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
        right={
          gwLabel ? (
            <button
              type="button"
              className={styles.gwPickerBtn}
              onClick={() => setGwPickerOpen(true)}
              aria-label={gwLabel}
            >
              {gwLabel}
              <svg
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className={styles.gwPickerChevron}
              >
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : undefined
        }
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
                  />
                ) : (
                  <PredictedLineupPitch
                    players={activeTeam.players}
                    teamShortName={activeTeam.shortName}
                    teamId={activeTeam.teamId}
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

      <BottomSheet
        open={gwPickerOpen}
        onClose={() => setGwPickerOpen(false)}
        title={copy.predictedLineupsSelectGameweek}
      >
        {gwPickerOpen && (
          <div className={styles.gwList}>
            {selectableGws.map((id) => (
              <button
                key={id}
                type="button"
                className={`${styles.gwOption} ${id === selectedGw ? styles.gwOptionSelected : ''}`}
                aria-pressed={id === selectedGw}
                onClick={() => selectGw(id)}
              >
                {interpolate(copy.predictedLineupsGwLabel, { n: id })}
              </button>
            ))}
          </div>
        )}
      </BottomSheet>

    </div>
  );
};

PredictedLineupsScreen.displayName = 'PredictedLineupsScreen';
