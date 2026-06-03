import React, { useMemo, useState } from 'react';

import { BottomSheet } from '@/components/ui/BottomSheet/BottomSheet';
import { copy, interpolate } from '@/lib/copy';
import { MAX_GAMEWEEK, type PlayerPosition, type PoolPlayer } from '@/types';

import { PlayerPickerRow } from './PlayerPickerRow';
import styles from './PlayerPickerSheet.module.css';

type SortKey = 'totalPoints' | 'nowCost' | 'selectedByPercent' | 'expectedPoints' | 'webName';

const POSITION_MAX: Record<PlayerPosition, number> = { GK: 2, DEF: 5, MID: 5, FWD: 3 };

export interface PlayerPickerSheetProps {
  open: boolean;
  outPlayer: PoolPlayer;
  candidates: PoolPlayer[];
  availableBudget: number;
  squadTeamCounts: Map<number, number>;
  squadPositionCounts: Map<PlayerPosition, number>;
  squadPlayerIds: Set<number>;
  targetGw: number | null;
  onSelect: (player: PoolPlayer) => void;
  onClose: () => void;
}

export const PlayerPickerSheet: React.FC<PlayerPickerSheetProps> = ({
  open,
  outPlayer,
  candidates,
  availableBudget,
  squadTeamCounts,
  squadPositionCounts,
  squadPlayerIds,
  targetGw,
  onSelect,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('selectedByPercent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder(key === 'webName' ? 'asc' : 'desc');
    }
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return candidates
      .filter((p) => !squadPlayerIds.has(p.id))
      .filter(
        (p) =>
          q === '' ||
          p.webName.toLowerCase().includes(q) ||
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (sortKey === 'webName') {
          const res = a.webName.localeCompare(b.webName);
          return sortOrder === 'asc' ? res : -res;
        }
        const aVal = parseFloat(String(a[sortKey]));
        const bVal = parseFloat(String(b[sortKey]));
        const res = bVal - aVal;
        return sortOrder === 'desc' ? res : -res;
      });
  }, [candidates, query, sortKey, sortOrder, squadPlayerIds]);

  const getLabelClass = (key: SortKey) => {
    if (sortKey !== key) return styles.label;
    const activeClass = sortOrder === 'asc' ? styles.label_asc : styles.label_desc;
    return `${styles.label} ${styles.label_sortable} ${activeClass}`;
  };

  const title = interpolate(copy.transfersPickerTitle, { name: outPlayer.webName });
  const subtitle = interpolate(copy.transfersPickerSubtitle, {
    position: outPlayer.position,
    cost: (outPlayer.nowCost / 10).toFixed(1),
  });

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title={title}>
        <div className={styles.inner}>
          <div className={styles.subheader}>
            <span className={styles.subtitle}>{subtitle}</span>
          </div>

          <div className={styles.controls}>
            <input
              className={styles.search}
              type="search"
              placeholder={copy.transfersPickerSearch}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className={styles.listHeader} role="row">
            <span
              role="columnheader"
              aria-sort={
                sortKey === 'webName' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'
              }
              className={getLabelClass('webName')}
              onClick={() => handleSort('webName')}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSort('webName');
                }
              }}
            >
              {copy.transfersColPlayer}
              {sortKey === 'webName' && (
                <span className={styles.sortArrow}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </span>
            <span role="columnheader" className={styles.label}>
              {targetGw
                ? `GW${targetGw}${targetGw < MAX_GAMEWEEK ? `-${Math.min(targetGw + 2, MAX_GAMEWEEK)}` : ''}`
                : copy.transfersColFix}
            </span>
            <span
              role="columnheader"
              aria-sort={
                sortKey === 'selectedByPercent'
                  ? sortOrder === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
              className={getLabelClass('selectedByPercent')}
              title={copy.transfersColOwnershipTitle}
              onClick={() => handleSort('selectedByPercent')}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSort('selectedByPercent');
                }
              }}
            >
              {copy.transfersColOwnership}
              {sortKey === 'selectedByPercent' && (
                <span className={styles.sortArrow}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </span>
            <span
              role="columnheader"
              aria-sort={
                sortKey === 'totalPoints'
                  ? sortOrder === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
              className={getLabelClass('totalPoints')}
              onClick={() => handleSort('totalPoints')}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSort('totalPoints');
                }
              }}
            >
              {copy.transfersColPts}
              {sortKey === 'totalPoints' && (
                <span className={styles.sortArrow}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </span>
            <span
              role="columnheader"
              aria-sort={
                sortKey === 'expectedPoints'
                  ? sortOrder === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
              className={getLabelClass('expectedPoints')}
              onClick={() => handleSort('expectedPoints')}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSort('expectedPoints');
                }
              }}
            >
              {copy.transfersColXPts}
              {sortKey === 'expectedPoints' && (
                <span className={styles.sortArrow}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </span>
            <span
              role="columnheader"
              aria-sort={
                sortKey === 'nowCost' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'
              }
              className={getLabelClass('nowCost')}
              onClick={() => handleSort('nowCost')}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSort('nowCost');
                }
              }}
            >
              {copy.transfersColCost}
              {sortKey === 'nowCost' && (
                <span className={styles.sortArrow}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </span>
          </div>

          <ul className={styles.list}>
            {filtered.map((player) => {
              const countFromTeam =
                (squadTeamCounts.get(player.team) ?? 0) - (outPlayer.team === player.team ? 1 : 0);
              const clubLimit = countFromTeam >= 3;
              const positionCount =
                (squadPositionCounts.get(player.position) ?? 0) -
                (outPlayer.position === player.position ? 1 : 0);
              const positionLimit = positionCount >= POSITION_MAX[player.position];
              return (
                <PlayerPickerRow
                  key={player.id}
                  player={player}
                  overBudget={player.nowCost > availableBudget}
                  clubLimitReached={clubLimit}
                  positionLimitReached={positionLimit}
                  onSelect={onSelect}
                />
              );
            })}
          </ul>
        </div>
      </BottomSheet>
    </>
  );
};

PlayerPickerSheet.displayName = 'PlayerPickerSheet';
