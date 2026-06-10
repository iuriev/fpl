import React from 'react';

import { useChipStrategy } from '@/api/queries';
import { ChipRecommendationCard } from '@/components/ui/ChipRecommendationCard/ChipRecommendationCard';
import { PremiumSheet } from '@/components/ui/PremiumSheet/PremiumSheet';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy } from '@/lib/copy';
import { useMyTeam } from '@/lib/my-team/MyTeamContext';
import { usePremiumStatus } from '@/lib/use-premium-status';

import styles from './ChipStrategyScreen.module.css';

function GhostCards() {
  return (
    <div className={styles.cards}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={styles.ghost} aria-hidden="true" />
      ))}
    </div>
  );
}

export const ChipStrategyScreen: React.FC = () => {
  const { myTeamId } = useMyTeam();
  const isPremium = usePremiumStatus();
  const [premiumOpen, setPremiumOpen] = React.useState(false);

  const { data, isFetching, refetch, isError, isFetched } = useChipStrategy(myTeamId);

  const handleCalculate = () => {
    if (!isPremium) {
      setPremiumOpen(true);
      return;
    }
    refetch();
  };

  return (
    <div className={styles.screen}>
      <ScreenHeader title={copy.chipStrategyTitle} />

      <div className={styles.content}>
        <div className={styles.subheader}>
          <span className={styles.subtitle}>{copy.chipStrategySubtitle}</span>
          <button
            className={styles.calcButton}
            onClick={handleCalculate}
            disabled={isFetching}
            aria-busy={isFetching}
          >
            {isFetching ? copy.chipStrategyCalculating : copy.chipStrategyCalculate}
          </button>
        </div>

        {isFetching && <GhostCards />}

        {!isFetching && !isFetched && <GhostCards />}

        {!isFetching && isFetched && data && (
          <div className={styles.cards}>
            {data.map((rec) => (
              <ChipRecommendationCard key={rec.chip} recommendation={rec} />
            ))}
          </div>
        )}

        {!isFetching && isError && (
          <p className={styles.error}>{copy.chipStrategyError}</p>
        )}
      </div>

      <PremiumSheet
        open={premiumOpen}
        onClose={() => setPremiumOpen(false)}
        title={copy.chipStrategyPremiumTitle}
        description={copy.chipStrategyPremiumDescription}
        freeLabel={copy.chipStrategyPremiumFreeLabel}
        premiumLabel={copy.chipStrategyPremiumPremiumLabel}
      />
    </div>
  );
};
