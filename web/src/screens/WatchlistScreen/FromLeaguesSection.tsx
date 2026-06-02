import React, { useState } from 'react';

import { useLeagueStandings, useLeagues } from '@/api/queries';
import { copy } from '@/lib/copy';
import type { LeagueEntry, StandingEntry } from '@/types';

import styles from './WatchlistScreen.module.css';

interface StandingsListProps {
  leagueId: number;
  watchedIds: Set<number>;
  isFull: boolean;
  onFollow: (teamId: number) => void;
}

function StandingsList({ leagueId, watchedIds, isFull, onFollow }: StandingsListProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useLeagueStandings(leagueId, page);

  if (isLoading) return <p className={styles.leagueLoading}>{copy.loadingPlaceholder}</p>;
  if (isError) return <p className={styles.leagueError}>{copy.watchlistFromLeaguesStandingsLoadError}</p>;
  if (!data) return null;

  return (
    <div className={styles.standingsList}>
      {data.standings.map((s: StandingEntry) => {
        const following = watchedIds.has(s.entry);
        return (
          <div key={s.entry} className={styles.standingRow}>
            <span className={styles.standingRank}>{s.rank}</span>
            <div className={styles.standingManager}>
              <span className={styles.standingPlayerName}>{s.playerName}</span>
              <span className={styles.standingEntryName}>{s.entryName}</span>
            </div>
            <span className={styles.standingEventTotal}>{s.eventTotal}</span>
            <button
              className={`${styles.followBtn} ${following ? styles.followingBtn : ''}`}
              onClick={() => !following && onFollow(s.entry)}
              disabled={(!following && isFull) || following}
              aria-pressed={following}
            >
              {following ? copy.watchlistFollowingButton : copy.watchlistFollowButton}
            </button>
          </div>
        );
      })}
      {data.hasNext && (
        <button
          className={styles.loadMoreBtn}
          onClick={() => setPage((p) => p + 1)}
        >
          {copy.watchlistFromLeaguesLoadMore}
        </button>
      )}
    </div>
  );
}

interface LeagueItemProps {
  league: LeagueEntry;
  watchedIds: Set<number>;
  isFull: boolean;
  onFollow: (teamId: number) => void;
}

function LeagueItem({ league, watchedIds, isFull, onFollow }: LeagueItemProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.leagueItem}>
      <button
        className={styles.leagueToggle}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={styles.leagueName}>{league.name}</span>
        <span className={styles.leagueRank}>your rank: {league.rank}</span>
        <span className={styles.leagueChevron}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <StandingsList
          leagueId={league.id}
          watchedIds={watchedIds}
          isFull={isFull}
          onFollow={onFollow}
        />
      )}
    </div>
  );
}

export interface FromLeaguesSectionProps {
  userTeamId: number | null;
  watchedIds: Set<number>;
  isFull: boolean;
  onFollow: (teamId: number) => void;
}

export const FromLeaguesSection: React.FC<FromLeaguesSectionProps> = ({
  userTeamId,
  watchedIds,
  isFull,
  onFollow,
}) => {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useLeagues(userTeamId);

  return (
    <div className={styles.fromLeagues}>
      <button
        className={styles.fromLeaguesToggle}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{copy.watchlistFromLeaguesHeading}</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={styles.fromLeaguesBody}>
          {!userTeamId && (
            <p className={styles.fromLeaguesHint}>{copy.watchlistFromLeaguesNoTeam}</p>
          )}
          {userTeamId && isLoading && <p className={styles.leagueLoading}>{copy.loadingPlaceholder}</p>}
          {userTeamId && isError && <p className={styles.leagueError}>{copy.watchlistFromLeaguesLoadError}</p>}
          {userTeamId && data && data.classic.map((league) => (
            <LeagueItem
              key={league.id}
              league={league}
              watchedIds={watchedIds}
              isFull={isFull}
              onFollow={onFollow}
            />
          ))}
        </div>
      )}
    </div>
  );
};

FromLeaguesSection.displayName = 'FromLeaguesSection';
