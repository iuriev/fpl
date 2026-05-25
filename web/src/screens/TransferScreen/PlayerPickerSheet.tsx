import React, { useMemo, useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet/BottomSheet';
import { copy, interpolate } from '@/lib/copy';
import type { PoolPlayer } from '@/types';
import { PlayerPickerRow } from './PlayerPickerRow';
import styles from './PlayerPickerSheet.module.css';

type SortKey = 'totalPoints' | 'nowCost' | 'form' | 'eventPoints' | 'selectedByPercent';

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'totalPoints',       label: copy.transfersSortPts },
  { key: 'nowCost',           label: copy.transfersSortPrice },
  { key: 'form',              label: copy.transfersSortForm },
  { key: 'eventPoints',       label: copy.transfersSortGwPts },
  { key: 'selectedByPercent', label: copy.transfersSortSel },
];

export interface PlayerPickerSheetProps {
  open: boolean;
  outPlayer: PoolPlayer;
  candidates: PoolPlayer[];
  availableBudget: number;
  squadTeamCounts: Map<number, number>;
  squadPlayerIds: Set<number>;
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
  onSelect,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('totalPoints');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return candidates
      .filter((p) => !squadPlayerIds.has(p.id))
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
  }, [candidates, query, sortKey, squadPlayerIds]);


  const title = interpolate(copy.transfersPickerTitle, { name: outPlayer.webName });
  const subtitle = interpolate(copy.transfersPickerSubtitle, {
    position: outPlayer.position,
    cost: (outPlayer.nowCost / 10).toFixed(1),
  });

  return (
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
          <div className={styles.sortPills} role="group" aria-label="Sort by">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                className={`${styles.sortPill} ${sortKey === opt.key ? styles.sortPill_active : ''}`}
                onClick={() => setSortKey(opt.key)}
              >
                {opt.label}
              </button>
            ))}
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
  );
};

PlayerPickerSheet.displayName = 'PlayerPickerSheet';
