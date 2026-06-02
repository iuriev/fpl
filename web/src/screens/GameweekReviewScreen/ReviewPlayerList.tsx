import React, { useState } from 'react';

import { PositionBadge } from '@/components/ui/PositionBadge/PositionBadge';
import { copy } from '@/lib/copy';
import type { SquadPlayer } from '@/types';

import { getPlayerPointsClass, getStatLabel, type PlayerPointsClass } from './review-helpers';
import styles from './ReviewPlayerList.module.css';

export interface ReviewPlayerListProps {
  starters: SquadPlayer[];
  bench: SquadPlayer[];
}

const PT_CLASS: Record<PlayerPointsClass, string> = {
  great: styles.rowGreat,
  good: styles.rowGood,
  neutral: styles.rowNeutral,
  bad: styles.rowBad,
};

function sortByPoints(players: SquadPlayer[]): SquadPlayer[] {
  return [...players].sort((a, b) => b.points - a.points);
}

function PlayerRow({ player, dimmed }: { player: SquadPlayer; dimmed?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const ptsClass = getPlayerPointsClass(player.points);
  const label = getStatLabel(player.stats);

  return (
    <>
      <button
        className={`${styles.row} ${PT_CLASS[ptsClass]} ${dimmed ? styles.rowDimmed : ''}`}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className={styles.club}>{player.club}</span>
        <span className={styles.info}>
          <span className={styles.name}>{player.name}</span>
          <span className={styles.meta}>
            <PositionBadge position={player.position} />
            {player.isCaptain && <span className={styles.capBadge}>{copy.statusCaptain}</span>}
            {player.isViceCaptain && (
              <span className={`${styles.capBadge} ${styles.vcBadge}`}>
                {copy.statusViceCaptain}
              </span>
            )}
            <span className={styles.label}>{label}</span>
          </span>
        </span>
        <span
          className={`${styles.pts} ${ptsClass === 'great' ? styles.ptsGreat : ''} ${ptsClass === 'bad' ? styles.ptsBad : ''}`}
        >
          {player.points}
        </span>
      </button>
      {expanded && (
        <div className={styles.statsRow}>
          {player.stats.minutes > 0 && <span>{player.stats.minutes} mins</span>}
          {player.stats.goals_scored > 0 && <span>⚽ {player.stats.goals_scored}</span>}
          {player.stats.assists > 0 && <span>🅰️ {player.stats.assists}</span>}
          {player.stats.clean_sheets > 0 && player.stats.minutes >= 60 && <span>🧤 CS</span>}
          {player.stats.bonus > 0 && <span>⭐ +{player.stats.bonus}</span>}
          {player.stats.yellow_cards > 0 && <span>🟨 YC</span>}
          {player.stats.red_cards > 0 && <span>🟥 RC</span>}
          {player.stats.saves > 0 && <span>🧤 {player.stats.saves} saves</span>}
          {player.stats.own_goals > 0 && <span>OG {player.stats.own_goals}</span>}
          {player.stats.penalties_missed > 0 && <span>✗ pen</span>}
        </div>
      )}
    </>
  );
}

export const ReviewPlayerList: React.FC<ReviewPlayerListProps> = ({ starters, bench }) => {
  const sortedStarters = sortByPoints(starters);
  const sortedBench = sortByPoints(bench);

  return (
    <div className={styles.section}>
      <span className={styles.sectionLabel}>{copy.reviewPlayersSection}</span>
      <div className={styles.list}>
        {sortedStarters.map((p) => (
          <PlayerRow key={p.id} player={p} />
        ))}
        <div className={styles.divider}>{copy.reviewBenchDivider}</div>
        {sortedBench.map((p) => (
          <PlayerRow key={p.id} player={p} dimmed />
        ))}
      </div>
    </div>
  );
};

ReviewPlayerList.displayName = 'ReviewPlayerList';
