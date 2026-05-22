import React from 'react';

import { copy } from '@/lib/copy';
import type { PlayerPosition, PlayerStatus, SquadPlayer } from '@/types';

import { Jersey } from '@/components/ui/Jersey/Jersey';
import styles from './SquadListView.module.css';

interface SquadListViewProps {
  starters: SquadPlayer[];
  bench: SquadPlayer[];
}

const POSITION_ORDER: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];

const GROUP_LABEL: Record<PlayerPosition | 'bench', string> = {
  GK: copy.listGroupGK,
  DEF: copy.listGroupDEF,
  MID: copy.listGroupMID,
  FWD: copy.listGroupFWD,
  bench: copy.listGroupBench,
};

const STAT_COLS = [
  { key: 'total_points' as const, label: copy.listColPts },
  { key: 'minutes' as const, label: copy.listColMP },
  { key: 'goals_scored' as const, label: copy.listColGS },
  { key: 'assists' as const, label: copy.listColA },
  { key: 'clean_sheets' as const, label: copy.listColCS },
  { key: 'goals_conceded' as const, label: copy.listColGC },
  { key: 'own_goals' as const, label: copy.listColOG },
  { key: 'penalties_saved' as const, label: copy.listColPS },
  { key: 'penalties_missed' as const, label: copy.listColPM },
  { key: 'yellow_cards' as const, label: copy.listColYC },
  { key: 'red_cards' as const, label: copy.listColRC },
  { key: 'saves' as const, label: copy.listColS },
  { key: 'bonus' as const, label: copy.listColBonus },
];

function availBadgeChar(status: PlayerStatus): string | null {
  const map: Partial<Record<PlayerStatus, string>> = {
    d: '!',
    i: '+',
    s: '!',
    u: '×',
    n: '×',
  };
  return map[status] ?? null;
}

function availBadgeVariant(status: PlayerStatus): 'warn' | 'error' | null {
  const map: Partial<Record<PlayerStatus, 'warn' | 'error'>> = {
    d: 'warn',
    i: 'error',
    s: 'error',
    u: 'error',
    n: 'error',
  };
  return map[status] ?? null;
}

function PlayerRow({ player }: { player: SquadPlayer }) {
  const badgeChar = availBadgeChar(player.status);
  const badgeVariant = availBadgeVariant(player.status);

  return (
    <tr className={styles.playerRow}>
      <td className={styles.identityCell}>
        <div className={styles.identity}>
          <div className={styles.kitWrap}>
            {badgeChar && badgeVariant && (
              <span
                className={`${styles.availBadge} ${styles[`availBadge_${badgeVariant}`]}`}
                aria-hidden="true"
              >
                {badgeChar}
              </span>
            )}
            <Jersey size="medium" teamCode={player.teamCode} position={player.position} alt={player.name} />
          </div>
          <div className={styles.nameGroup}>
            <span className={styles.name}>{player.name}</span>
            <div className={styles.meta}>
              <span className={styles.posBadge}>{player.position}</span>
              <span className={styles.club}>{player.club}</span>
              {(player.isCaptain || player.isViceCaptain) && (
                <span className={styles.capBadge}>
                  {player.isCaptain ? copy.statusCaptain : copy.statusViceCaptain}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      {STAT_COLS.map((col) => (
        <td key={col.key} className={styles.statCell}>
          {player.stats[col.key]}
        </td>
      ))}
    </tr>
  );
}

function SectionRow({ label }: { label: string }) {
  return (
    <tr className={styles.sectionRow}>
      <td className={styles.sectionCell} colSpan={STAT_COLS.length + 1}>
        {label}
      </td>
    </tr>
  );
}

export const SquadListView: React.FC<SquadListViewProps> = ({ starters, bench }) => {
  const byPosition = new Map<PlayerPosition, SquadPlayer[]>(
    POSITION_ORDER.map((pos) => [pos, []]),
  );
  for (const p of starters) {
    byPosition.get(p.position)?.push(p);
  }

  return (
    <div className={styles.scrollWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={`${styles.identityCell} ${styles.headCell}`} scope="col" />
            {STAT_COLS.map((col) => (
              <th key={col.key} className={`${styles.statCell} ${styles.headCell}`} scope="col">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {POSITION_ORDER.map((pos) => {
            const group = byPosition.get(pos) ?? [];
            if (group.length === 0) return null;
            return (
              <React.Fragment key={pos}>
                <SectionRow label={GROUP_LABEL[pos]} />
                {group.map((p) => (
                  <PlayerRow key={p.id} player={p} />
                ))}
              </React.Fragment>
            );
          })}
          {bench.length > 0 && (
            <React.Fragment>
              <SectionRow label={GROUP_LABEL.bench} />
              {bench.map((p) => (
                <PlayerRow key={p.id} player={p} />
              ))}
            </React.Fragment>
          )}
        </tbody>
      </table>
    </div>
  );
};

SquadListView.displayName = 'SquadListView';
