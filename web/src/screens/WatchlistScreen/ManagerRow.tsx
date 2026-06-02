import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useEntry, useHistory, useSquad, useTransfers } from '@/api/queries';
import { copy, interpolate } from '@/lib/copy';

import styles from './WatchlistScreen.module.css';

export interface ManagerRowProps {
  teamId: number;
  currentGw: number;
  onRemove: () => void;
}

function fmt(n: number): string {
  return n.toLocaleString('en-GB');
}

function RankDelta({ current, prev }: { current: number; prev: number | undefined }) {
  if (prev === undefined) return <span className={styles.rankNeutral}>—</span>;
  const delta = prev - current;
  if (delta > 0) return <span className={styles.rankUp}>↑ {fmt(delta)}</span>;
  if (delta < 0) return <span className={styles.rankDown}>↓ {fmt(-delta)}</span>;
  return <span className={styles.rankNeutral}>—</span>;
}

function Cell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`${styles.cell} ${className ?? ''}`}>{children}</td>;
}

function SkeletonCell() {
  return <Cell><span className={styles.skeletonCell} aria-hidden="true" /></Cell>;
}

export const ManagerRow: React.FC<ManagerRowProps> = ({ teamId, currentGw, onRemove }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: entry, isLoading: entryLoading, isError: entryError } = useEntry(teamId);
  const { data: squad, isLoading: squadLoading } = useSquad(teamId, currentGw);
  const { data: history, isLoading: historyLoading } = useHistory(teamId);
  const { data: transfersData, isLoading: transfersLoading } = useTransfers(teamId);

  const isLoading = entryLoading || squadLoading || historyLoading || transfersLoading;

  if (entryError) {
    return (
      <tr className={styles.row}>
        <td colSpan={9} className={styles.rowError}>
          <span>Team {teamId} — {copy.watchlistLoadError}</span>
          <button
            className={styles.removeBtn}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            aria-label={copy.watchlistRowErrorRemove}
          >
            ✕
          </button>
        </td>
      </tr>
    );
  }

  const captain = squad?.starters.find((p) => p.isCaptain);
  const latestTransfers = transfersData?.transfers
    .filter((t) => t.event === currentGw)
    .map((t) => t.elementInName);

  const sortedHistory = history?.gameweeks ?? [];
  const prevOverallRank = sortedHistory.length >= 2 ? sortedHistory[1].overallRank : undefined;

  const handleRowClick = () => {
    const returnTo = location.pathname + location.search;
    try { sessionStorage.setItem('fpl-guest-return-to', returnTo); } catch { /* ignore */ }
    navigate(`/?teamId=${teamId}`, { state: { returnTo } });
  };

  return (
    <tr
      className={styles.row}
      onClick={handleRowClick}
      style={{ cursor: 'pointer' }}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleRowClick()}
      aria-label={entry ? `${entry.managerName} — view squad` : undefined}
    >
      <Cell className={styles.cellSticky}>
        {isLoading && !entry ? (
          <span className={styles.skeletonCell} />
        ) : (
          <div className={styles.managerCell}>
            <span className={styles.managerName}>{entry?.managerName}</span>
            <span className={styles.teamName}>{entry?.teamName}</span>
          </div>
        )}
      </Cell>

      {isLoading ? (
        <>
          <SkeletonCell />
          <SkeletonCell />
          <SkeletonCell />
          <SkeletonCell />
          <SkeletonCell />
          <SkeletonCell />
          <SkeletonCell />
        </>
      ) : (
        <>
          <Cell>{entry ? fmt(entry.eventPoints) : '—'}</Cell>
          <Cell>{entry ? fmt(entry.eventRank) : '—'}</Cell>
          <Cell>{entry ? fmt(entry.overallRank) : '—'}</Cell>
          <Cell>
            <RankDelta current={entry?.overallRank ?? 0} prev={prevOverallRank} />
          </Cell>
          <Cell>{squad ? squad.summary.transfers : '—'}</Cell>
          <Cell>{captain?.name ?? '—'}</Cell>
          <Cell>
            {latestTransfers && latestTransfers.length > 0
              ? latestTransfers.join(', ')
              : '—'}
          </Cell>
        </>
      )}

      <Cell>
        <button
          className={styles.removeBtn}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label={interpolate(copy.watchlistRemoveAriaLabel, {
            name: entry?.managerName ?? String(teamId),
          })}
        >
          ✕
        </button>
      </Cell>
    </tr>
  );
};

ManagerRow.displayName = 'ManagerRow';
