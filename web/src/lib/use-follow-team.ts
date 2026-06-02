import { useCallback, useEffect, useState } from 'react';

import { useWatchlistRepository } from './watchlist-repository';

export function useFollowTeam(teamId: number, enabled = true) {
  const repo = useWatchlistRepository();
  const [following, setFollowing] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    repo.has(teamId).then(setFollowing);
  }, [repo, teamId, enabled]);

  const toggle = useCallback(async () => {
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
  }, [following, repo, teamId]);

  return { following, limitReached, toggle };
}
