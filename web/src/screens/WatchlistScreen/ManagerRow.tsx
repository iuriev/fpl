import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useEntry, useHistory, useSquad, useTransfers } from '@/api/queries';
import { copy, interpolate } from '@/lib/copy';

import styles from './ManagerRow.module.css';

export interface ManagerRowProps {
  teamId: number;
  currentGw: number;
  onRemove: () => void;
  isOwnTeam?: boolean;
}

function fmt(n: number): string {
  return n.toLocaleString('en-GB');
}

function fmtValue(v: number): string {
  return `£${v.toFixed(1)}m`;
}

function RankDelta({ current, prev }: { current: number; prev: number | undefined }) {
  if (prev === undefined) return <span className={styles.deltaNeutral}>—</span>;
  const delta = prev - current;
  if (delta > 0) return <span className={styles.deltaUp}>↑{fmt(delta)}</span>;
  if (delta < 0) return <span className={styles.deltaDown}>↓{fmt(-delta)}</span>;
  return <span className={styles.deltaNeutral}>—</span>;
}

export const ManagerRow: React.FC<ManagerRowProps> = ({ teamId, currentGw, onRemove, isOwnTeam }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: entry, isLoading: entryLoading, isError: entryError } = useEntry(teamId);
  const { data: squad, isLoading: squadLoading } = useSquad(teamId, currentGw);
  const { data: history, isLoading: historyLoading } = useHistory(teamId);
  const { data: transfersData, isLoading: transfersLoading } = useTransfers(teamId);

  const isLoading = entryLoading || squadLoading || historyLoading || transfersLoading;

  const handleRowClick = () => {
    if (isOwnTeam) {
      navigate(`/?teamId=${teamId}`);
      return;
    }
    const returnTo = location.pathname + location.search;
    navigate(`/?teamId=${teamId}`, { state: { returnTo } });
  };

  if (entryError) {
    return (
      <div className={styles.card}>
        <div className={styles.errorRow}>
          <span className={styles.errorText}>Team {teamId} — {copy.watchlistLoadError}</span>
          <button
            className={styles.unfollowBtn}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            aria-label={copy.watchlistRowErrorRemove}
          >
            {copy.watchlistUnfollow}
          </button>
        </div>
      </div>
    );
  }

  const allPlayers = squad ? [...squad.starters, ...squad.bench] : [];
  const captain = allPlayers.find((p) => p.isCaptain);
  const viceCaptain = allPlayers.find((p) => p.isViceCaptain);

  const gwTransfers = transfersData?.transfers.filter((t) => t.event === currentGw) ?? [];
  const transfersIn = gwTransfers.map((t) => t.elementInName);
  const transfersOut = gwTransfers.map((t) => t.elementOutName);

  const sortedHistory = history?.gameweeks ?? [];
  const historyGw = sortedHistory[0];
  const prevHistoryGw = sortedHistory[1];

  return (
    <div
      className={styles.card}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleRowClick()}
      aria-label={entry ? `${entry.managerName} — view squad` : undefined}
    >
      <div className={styles.top}>
        <div className={styles.scoreBlock}>
          {isLoading && !entry ? (
            <span className={styles.skeletonScore} aria-hidden="true" />
          ) : (
            <>
              <span className={styles.pts}>{entry ? fmt(entry.eventPoints) : '—'}</span>
              <span className={styles.ptsLabel}>{copy.watchlistColGwPts}</span>
            </>
          )}
        </div>

        <div className={styles.identity}>
          {isLoading && !entry ? (
            <span className={styles.skeletonName} aria-hidden="true" />
          ) : (
            <>
              <span className={styles.managerName}>{entry?.managerName}</span>
              <span className={styles.teamName}>{entry?.teamName}</span>
            </>
          )}
        </div>

        <div className={styles.rankBlock}>
          {isLoading ? (
            <span className={styles.skeletonCell} aria-hidden="true" />
          ) : (
            <>
              <span className={styles.or}>{entry ? fmt(entry.overallRank) : '—'}</span>
              <span className={styles.orLabel}>{copy.watchlistColOverallRank}</span>
              <RankDelta current={entry?.overallRank ?? 0} prev={prevHistoryGw?.overallRank} />
            </>
          )}
        </div>
      </div>

      {!isLoading && (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statVal}>{entry ? fmt(entry.eventRank) : '—'}</span>
              <span className={styles.statLbl}>{copy.watchlistColGwRank}</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statVal} ${historyGw?.transferCost ? styles.statValNeg : styles.statValPos}`}>
                {historyGw?.transferCost ? `−${historyGw.transferCost} pts` : copy.watchlistTransferCostFree}
              </span>
              <span className={styles.statLbl}>{copy.watchlistColXfrCost}</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statVal} ${styles.statValAccent}`}>
                {historyGw ? fmtValue(historyGw.teamValue) : '—'}
              </span>
              <span className={styles.statLbl}>{copy.watchlistColSquadValue}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statVal}>
                {squad?.summary.bank !== undefined ? fmtValue(squad.summary.bank / 10) : '—'}
              </span>
              <span className={styles.statLbl}>{copy.watchlistColBank}</span>
            </div>
          </div>

          <div className={styles.leadership}>
            <div className={styles.leader}>
              <span className={styles.capBadge}>{copy.watchlistColCaptain}</span>
              <span className={styles.leaderName}>{captain?.name ?? '—'}</span>
            </div>
            <span className={styles.sepLine} />
            <div className={styles.leader}>
              <span className={styles.vcBadge}>{copy.watchlistColViceCaptain}</span>
              <span className={styles.leaderName}>{viceCaptain?.name ?? '—'}</span>
            </div>
          </div>

          {transfersIn.length > 0 && (
            <div className={styles.transfers}>
              <div className={styles.xfrRow}>
                <span className={styles.xfrChip}>
                  <span className={styles.xfrLbl}>{copy.watchlistColTransfers}</span>
                  <span className={styles.xfrVal}>{squad?.summary.transfers ?? 0}</span>
                </span>
              </div>
              <div className={styles.xfrPlayers}>
                <div className={styles.xfrLine}>
                  <span className={styles.inBadge}>IN</span>
                  <span className={styles.xfrNames}>{transfersIn.join(', ')}</span>
                </div>
                {transfersOut.length > 0 && (
                  <div className={styles.xfrLine}>
                    <span className={styles.outBadge}>OUT</span>
                    <span className={styles.xfrNamesOut}>{transfersOut.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <div className={styles.actions}>
        <button
          className={styles.unfollowBtn}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          disabled={isLoading}
          aria-label={interpolate(copy.watchlistRemoveAriaLabel, {
            name: entry?.managerName ?? String(teamId),
          })}
        >
          {copy.watchlistUnfollow}
        </button>
      </div>
    </div>
  );
};

ManagerRow.displayName = 'ManagerRow';
