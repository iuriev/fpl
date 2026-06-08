import { useCallback, useEffect, useState } from 'react';

import { useShowPlayerWatchlistPremium } from './player-watchlist-premium/PlayerWatchlistPremiumContext';
import { usePlayerWatchlistRepository } from './player-watchlist-repository';

export function useFollowPlayer(fplCode: number) {
  const repo = usePlayerWatchlistRepository();
  const showPremium = useShowPlayerWatchlistPremium();
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!fplCode) return;
    repo.has(fplCode).then(setFollowing);
  }, [repo, fplCode]);

  const toggle = useCallback(async () => {
    if (!fplCode) return;
    if (following) {
      await repo.remove(fplCode);
      setFollowing(false);
    } else {
      const result = await repo.add(fplCode);
      if (result === 'ok') {
        setFollowing(true);
      } else if (result === 'limit') {
        showPremium();
      }
    }
  }, [following, repo, fplCode, showPremium]);

  return { following, toggle };
}
