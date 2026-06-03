import React, { useMemo } from 'react';

import { useGameweeks, useHistory, usePlayerPool, useSquad } from '@/api/queries';
import { Button } from '@/components/ui/Button/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy } from '@/lib/copy';

import styles from './GameweekReviewScreen.module.css';
import {
  buildTransferPairs,
  computeWhatIfScore,
  diffSquads,
  findReviewGw,
} from './review-helpers';
import { ReviewBench } from './ReviewBench';
import { ReviewHero } from './ReviewHero';
import { ReviewPlayerList } from './ReviewPlayerList';
import { ReviewTransfers } from './ReviewTransfers';
import { ReviewWhatIf } from './ReviewWhatIf';

export interface GameweekReviewScreenProps {
  teamId: number;
}

export const GameweekReviewScreen: React.FC<GameweekReviewScreenProps> = ({ teamId }) => {
  const { data: gameweeksData } = useGameweeks();
  const { data: historyData, isLoading: historyLoading, isError: historyError, refetch } =
    useHistory(teamId);
  const { data: poolData } = usePlayerPool();

  const reviewGw = useMemo(
    () => (gameweeksData ? findReviewGw(gameweeksData.gameweeks) : null),
    [gameweeksData]
  );

  const prevGw = reviewGw !== null && reviewGw > 1 ? reviewGw - 1 : null;

  const { data: currentSquad } = useSquad(teamId, reviewGw);
  const { data: previousSquad } = useSquad(teamId, prevGw);

  const historyGw = useMemo(
    () => historyData?.gameweeks.find((g) => g.gw === reviewGw) ?? null,
    [historyData, reviewGw]
  );

  const previousHistoryGw = useMemo(
    () => (prevGw ? historyData?.gameweeks.find((g) => g.gw === prevGw) ?? null : null),
    [historyData, prevGw]
  );

  const reviewGwData = useMemo(() => {
    if (!currentSquad || !historyGw || !poolData) return null;

    const allCurrent = [...currentSquad.starters, ...currentSquad.bench];
    const allPrevious = previousSquad
      ? [...previousSquad.starters, ...previousSquad.bench]
      : [];

    const { transferredInIds, transferredOutIds } =
      allPrevious.length > 0
        ? diffSquads(allCurrent, allPrevious)
        : { transferredInIds: [], transferredOutIds: [] };

    const transferPairs = buildTransferPairs(
      allCurrent,
      allPrevious,
      poolData.players,
      transferredInIds,
      transferredOutIds
    );

    const whatIfScore =
      historyGw.transfers > 0
        ? computeWhatIfScore(historyGw.gwPoints, transferPairs, historyGw.transferCost)
        : historyGw.gwPoints;

    const reviewGwObj = gameweeksData?.gameweeks.find((g) => g.id === reviewGw);

    return {
      gwPoints: historyGw.gwPoints,
      overallRank: historyGw.overallRank,
      previousOverallRank: previousHistoryGw?.overallRank,
      gwRank: historyGw.gwRank,
      averageScore: reviewGwObj?.averageScore,
      highestScore: reviewGwObj?.highestScore,
      activeChip: currentSquad.activeChip,
      starters: currentSquad.starters,
      bench: currentSquad.bench,
      pointsOnBench: historyGw.pointsOnBench,
      transferPairs,
      transferCost: historyGw.transferCost,
      transfers: historyGw.transfers,
      whatIfScore,
    };
  }, [
    currentSquad,
    previousSquad,
    historyGw,
    previousHistoryGw,
    poolData,
    gameweeksData,
    reviewGw,
  ]);

  return (
    <div className={styles.screen}>
      <ScreenHeader
        title={copy.reviewTitle}
        teamId={teamId}
        right={reviewGw ? <span className={styles.gwBadge}>GW {reviewGw}</span> : undefined}
      />

      <div className={styles.body}>
        {historyLoading && <div className={styles.loading}>{copy.loadingPlaceholder}</div>}

        {historyError && (
          <div className={styles.stateCenter}>
            <p className={styles.stateText}>{copy.reviewLoadError}</p>
            <Button variant="secondary" onClick={() => refetch()}>
              {copy.reviewRetry}
            </Button>
          </div>
        )}

        {!historyLoading && !historyError && !reviewGw && (
          <div className={styles.stateCenter}>
            <p className={styles.stateText}>{copy.reviewNoGw}</p>
          </div>
        )}

        {reviewGwData && (
          <div className={styles.cards}>
            <ReviewHero
              gwNumber={reviewGw!}
              gwPoints={reviewGwData.gwPoints}
              overallRank={reviewGwData.overallRank}
              previousOverallRank={reviewGwData.previousOverallRank}
              gwRank={reviewGwData.gwRank}
              averageScore={reviewGwData.averageScore}
              highestScore={reviewGwData.highestScore}
              activeChip={reviewGwData.activeChip}
            />
            <ReviewPlayerList
              starters={reviewGwData.starters}
              bench={reviewGwData.bench}
            />
            <ReviewBench
              bench={reviewGwData.bench}
              pointsOnBench={reviewGwData.pointsOnBench}
            />
            {reviewGwData.transfers > 0 && (
              <ReviewTransfers
                transferPairs={reviewGwData.transferPairs}
                transferCost={reviewGwData.transferCost}
                transfers={reviewGwData.transfers}
              />
            )}
            {reviewGwData.transfers > 0 && (
              <ReviewWhatIf
                actualPoints={reviewGwData.gwPoints}
                whatIfScore={reviewGwData.whatIfScore}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

GameweekReviewScreen.displayName = 'GameweekReviewScreen';
