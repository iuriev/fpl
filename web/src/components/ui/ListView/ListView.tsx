import React, { useState } from 'react';

import { CapInlineBadge } from '@/components/ui/CapInlineBadge/CapInlineBadge';
import { Jersey } from '@/components/ui/Jersey/Jersey';
import { PositionBadge } from '@/components/ui/PositionBadge/PositionBadge';
import { StatusDot } from '@/components/ui/StatusDot/StatusDot';
import { copy } from '@/lib/copy';
import type { PlayerPosition, PlayerStats, SquadPlayer } from '@/types';

import styles from './ListView.module.css';

const IDENTITY_W = '12rem';

const LIST_COLS: ReadonlyArray<{
  key: keyof PlayerStats;
  label: string;
  fullLabel: string;
  width: string;
  highlight?: boolean;
}> = [
  { key: 'total_points',     label: copy.listColPts,   fullLabel: copy.listLegendPts,   width: '2.75rem',  highlight: true },
  { key: 'minutes',          label: copy.listColMP,    fullLabel: copy.listLegendMP,    width: '2.375rem' },
  { key: 'goals_scored',     label: copy.listColGS,    fullLabel: copy.listLegendGS,    width: '2.375rem' },
  { key: 'assists',          label: copy.listColA,     fullLabel: copy.listLegendA,     width: '2.25rem'  },
  { key: 'clean_sheets',     label: copy.listColCS,    fullLabel: copy.listLegendCS,    width: '2.375rem' },
  { key: 'goals_conceded',   label: copy.listColGC,    fullLabel: copy.listLegendGC,    width: '2.375rem' },
  { key: 'own_goals',        label: copy.listColOG,    fullLabel: copy.listLegendOG,    width: '2.375rem' },
  { key: 'penalties_saved',  label: copy.listColPS,    fullLabel: copy.listLegendPS,    width: '2.375rem' },
  { key: 'penalties_missed', label: copy.listColPM,    fullLabel: copy.listLegendPM,    width: '2.375rem' },
  { key: 'yellow_cards',     label: copy.listColYC,    fullLabel: copy.listLegendYC,    width: '2.375rem' },
  { key: 'red_cards',        label: copy.listColRC,    fullLabel: copy.listLegendRC,    width: '2.375rem' },
  { key: 'saves',            label: copy.listColS,     fullLabel: copy.listLegendS,     width: '2.25rem'  },
  { key: 'bonus',            label: copy.listColBonus, fullLabel: copy.listLegendBonus, width: '2.625rem' },
] as const;

const INNER_MIN_W = '43.25rem';

const POSITION_ORDER: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];

const SECTION_LABELS: Record<PlayerPosition | 'bench', string> = {
  GK:    copy.listGroupGK,
  DEF:   copy.listGroupDEF,
  MID:   copy.listGroupMID,
  FWD:   copy.listGroupFWD,
  bench: copy.listGroupBench,
};

type SortDir = 'asc' | 'desc';

interface SortState {
  key: keyof PlayerStats;
  dir: SortDir;
}

function ColHeader({
  sort,
  onSort,
}: {
  sort: SortState;
  onSort: (key: keyof PlayerStats) => void;
}) {
  return (
    <tr>
      <th className={styles.colHeaderIdentity} style={{ width: IDENTITY_W }}>
        Player
      </th>
      {LIST_COLS.map(c => (
        <th
          key={c.key}
          className={[
            styles.colHeaderCell,
            c.highlight || sort.key === c.key ? styles.colHeaderCell_hi : '',
          ].filter(Boolean).join(' ')}
          style={{ width: c.width }}
          onClick={() => onSort(c.key)}
        >
          {c.label}
          {sort.key === c.key && (
            <span className={styles.sortArrow}>
              {sort.dir === 'desc' ? '↓' : '↑'}
            </span>
          )}
        </th>
      ))}
    </tr>
  );
}

function SectionRow({ label, count }: { label: string; count: number }) {
  return (
    <tr className={styles.sectionRow}>
      <td className={styles.sectionCell}>
        <span className={styles.sectionLabel}>{label}</span>
        <span className={styles.sectionCount}>{count}</span>
      </td>
      {LIST_COLS.map(c => <td key={c.key} />)}
    </tr>
  );
}

function PlayerRow({ player, isLast }: { player: SquadPlayer; isLast: boolean }) {
  const cap = player.isCaptain ? 'C' : player.isViceCaptain ? 'V' : null;

  return (
    <tr className={`${styles.playerRow}${isLast ? ` ${styles.playerRow_last}` : ''}`}>
      <td className={styles.identityCell}>
        <div className={styles.kitWrap}>
          <Jersey size="medium" teamCode={player.teamCode} position={player.position} alt={player.name} />
          {player.status !== 'a' && (
            <span className={styles.statusDotOverlay}>
              <StatusDot status={player.status} />
            </span>
          )}
        </div>
        <div className={styles.nameGroup}>
          <div className={styles.nameRow}>
            <span className={styles.name}>{player.name}</span>
            <CapInlineBadge cap={cap} />
          </div>
          <div className={styles.metaRow}>
            <PositionBadge position={player.position} />
            <span>{player.club}</span>
          </div>
        </div>
      </td>

      {LIST_COLS.map(c => {
        const v = player.stats[c.key];
        const isNull = v === null || v === undefined;
        const isZero = !isNull && v === 0;
        return (
          <td
            key={c.key}
            className={[
              styles.statCell,
              c.highlight ? styles.statCell_hi : '',
              !c.highlight && isZero ? styles.statCell_zero : '',
            ].filter(Boolean).join(' ')}
          >
            {isNull ? '—' : v}
          </td>
        );
      })}
    </tr>
  );
}

function ColLegend() {
  return (
    <div className={styles.legend}>
      <span className={styles.legendHeading}>{copy.listLegendHeading}</span>
      {LIST_COLS.map(c => (
        <span key={c.key} className={styles.legendItem}>
          <span className={styles.legendAbbr}>{c.label}</span>
          <span className={styles.legendFull}>{c.fullLabel}</span>
        </span>
      ))}
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className={styles.skeletonRow}>
      <td className={styles.skeletonIdentity}>
        <div className={styles.skeletonKit} />
        <div className={styles.skeletonNameLines}>
          <div className={`${styles.skeletonLine} ${styles.skeletonLine_name}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonLine_meta}`} />
        </div>
      </td>
      {LIST_COLS.map(c => (
        <td key={c.key} className={styles.skeletonStatCell}>
          <div className={styles.skeletonStat} style={{ width: `calc(${c.width} - 1.125rem)` }} />
        </td>
      ))}
    </tr>
  );
}

export interface ListViewProps {
  starters: SquadPlayer[];
  bench: SquadPlayer[];
}

export const ListView: React.FC<ListViewProps> = ({ starters, bench }) => {
  const [sort, setSort] = useState<SortState>({ key: 'total_points', dir: 'desc' });

  const handleSort = (key: keyof PlayerStats) => {
    setSort(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
        : { key, dir: 'desc' }
    );
  };

  const sortSection = (players: SquadPlayer[]) =>
    [...players].sort((a, b) => {
      const av = a.stats[sort.key];
      const bv = b.stats[sort.key];
      return sort.dir === 'desc' ? bv - av : av - bv;
    });

  const byPosition = new Map<PlayerPosition, SquadPlayer[]>(
    POSITION_ORDER.map(pos => [pos, []]),
  );
  for (const p of starters) {
    byPosition.get(p.position)?.push(p);
  }

  const sections: Array<{ id: string; label: string; players: SquadPlayer[] }> = [
    ...POSITION_ORDER
      .filter(pos => (byPosition.get(pos)?.length ?? 0) > 0)
      .map(pos => ({ id: pos, label: SECTION_LABELS[pos], players: byPosition.get(pos)! })),
    ...(bench.length > 0 ? [{ id: 'bench', label: SECTION_LABELS.bench, players: bench }] : []),
  ];

  return (
    <div className={styles.scrollWrap}>
      <div className={styles.tableScrollArea}>
        <table className={styles.table} style={{ minWidth: INNER_MIN_W }}>
          <thead>
            <ColHeader sort={sort} onSort={handleSort} />
          </thead>
          <tbody>
            {sections.map(s => {
              const sorted = sortSection(s.players);
              return (
                <React.Fragment key={s.id}>
                  <SectionRow label={s.label} count={s.players.length} />
                  {sorted.map((p, i) => (
                    <PlayerRow key={p.id} player={p} isLast={i === sorted.length - 1} />
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <ColLegend />
    </div>
  );
};

ListView.displayName = 'ListView';

export const ListViewSkeleton: React.FC = () => {
  return (
    <div className={styles.scrollWrap}>
      <div className={styles.tableScrollArea}>
        <table className={styles.table} style={{ minWidth: INNER_MIN_W }}>
          <thead>
            <ColHeader sort={{ key: 'total_points', dir: 'desc' }} onSort={() => {}} />
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
      <ColLegend />
    </div>
  );
};

ListViewSkeleton.displayName = 'ListViewSkeleton';