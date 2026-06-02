import { useCallback, useEffect, useState } from 'react';

import { useShowPlayerWatchlistPremium } from './player-watchlist-premium';
import { usePlayerWatchlistRepository } from './player-watchlist-repository';

export function useFollowPlayer(playerId: number) {
  const repo = usePlayerWatchlistRepository();
  const showPremium = useShowPlayerWatchlistPremium();
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    repo.has(playerId).then(setFollowing);
  }, [repo, playerId]);

  const toggle = useCallback(async () => {
    if (following) {
      await repo.remove(playerId);
      setFollowing(false);
    } else {
      const result = await repo.add(playerId);
      if (result === 'ok') {
        setFollowing(true);
      } else if (result === 'limit') {
        showPremium();
      }
    }
  }, [following, repo, playerId, showPremium]);

  return { following, toggle };
}
