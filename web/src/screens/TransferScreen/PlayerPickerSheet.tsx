import React, { useMemo, useState } from 'react';

import { BottomSheet } from '@/components/ui/BottomSheet/BottomSheet';
import { copy, interpolate } from '@/lib/copy';
import type { PoolPlayer } from '@/types';

import { PlayerPickerRow } from './PlayerPickerRow';
import { SORT_OPTIONS, SortPickerSheet } from './SortPickerSheet';
import type { SortKey } from './SortPickerSheet';
import styles from './PlayerPickerSheet.module.css';

type PositionFilter = 'ALL' | 'DEF' | 'MID' | 'FWD';

const POS_LABELS: Record<PositionFilter, string> = {
  ALL: copy.transfersPositionAll,
  DEF: copy.positionDEF,
  MID: copy.positionMID,
  FWD: copy.positionFWD,
};

const POS_FILTERS: PositionFilter[] = ['ALL', 'DEF', 'MID', 'FWD'];

export interface PlayerPickerSheetProps {
  open: boolean;
  outPlayer: PoolPlayer;
  candidates: PoolPlayer[];
  availableBudget: number;
  squadTeamCounts: Map<number, number>;
  squadPlayerIds: Set<number>;
  isOutfield: boolean;
  onSelect: (player: PoolPlayer) => void;
  onClose: () => void;
}

export const PlayerPickerSheet: React.FC<PlayerPickerSheetProps> = ({
  open,
  outPlayer,
  candidates,
  availableBudget,
  squadTeamCounts,
  squadPlayerIds,
  isOutfield,
  onSelect,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('totalPoints');
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('ALL');
  const [showSort, setShowSort] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return candidates
      .filter((p) => !squadPlayerIds.has(p.id))
      .filter((p) => positionFilter === 'ALL' || p.position === positionFilter)
      .filter(
        (p) =>
          q === '' ||
          p.webName.toLowerCase().includes(q) ||
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        const aVal = parseFloat(String(a[sortKey]));
        const bVal = parseFloat(String(b[sortKey]));
        return bVal - aVal;
      });
  }, [candidates, query, sortKey, squadPlayerIds, positionFilter]);

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
            <div className={styles.filterRow}>
              {isOutfield && (
                <div className={styles.posTabs} role="group" aria-label="Filter by position">
                  {POS_FILTERS.map((pos) => (
                    <button
                      key={pos}
                      className={`${styles.posTab} ${positionFilter === pos ? styles.posTab_active : ''}`}
                      onClick={() => setPositionFilter(pos)}
                    >
                      {POS_LABELS[pos]}
                    </button>
                  ))}
                </div>
              )}
              <button
                className={`${styles.sortBtn} ${!isOutfield ? styles.sortBtn_alone : ''}`}
                onClick={() => setShowSort(true)}
              >
                {copy.transfersSortButton}
                <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" width="12" height="12">
                  <path d="M2 3.5h10M4 7h6M6 10.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <ul className={styles.list}>
            {filtered.map((player) => {
              const countFromTeam = (squadTeamCounts.get(player.team) ?? 0)
                - (outPlayer.team === player.team ? 1 : 0);
              const clubLimit = countFromTeam >= 3;
              return (
                <PlayerPickerRow
                  key={player.id}
                  player={player}
                  overBudget={player.nowCost > availableBudget}
                  clubLimitReached={clubLimit}
                  onSelect={onSelect}
                />
              );
            })}
          </ul>
        </div>
      </BottomSheet>
      <SortPickerSheet
        open={showSort}
        sortKey={sortKey}
        onSelect={(key) => { setSortKey(key); setShowSort(false); }}
        onClose={() => setShowSort(false)}
      />
    </>
  );
};

PlayerPickerSheet.displayName = 'PlayerPickerSheet';
