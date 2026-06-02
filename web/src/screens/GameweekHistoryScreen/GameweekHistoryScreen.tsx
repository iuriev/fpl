import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useHistory } from '@/api/queries';
import { Button } from '@/components/ui/Button/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy } from '@/lib/copy';
import type { HistoryGameweek } from '@/types';

import styles from './GameweekHistoryScreen.module.css';
import { formatNumber, formatValue, getRankDirection, type RankDirection } from './history-helpers';

export interface GameweekHistoryScreenProps {
  teamId: number;
}

const DIR_SYMBOL: Record<RankDirection, string> = {
  up: '↑',
  down: '↓',
  neutral: '—',
};

const DIR_CLASS: Record<RankDirection, string> = {
  up: styles.dirUp,
  down: styles.dirDown,
  neutral: styles.dirNeutral,
};

function RankDir({ current, previous }: { current: number; previous: number | undefined }) {
  const dir = getRankDirection(current, previous);
  return <span className={DIR_CLASS[dir]}>{DIR_SYMBOL[dir]}</span>;
}

export const GameweekHistoryScreen: React.FC<GameweekHistoryScreenProps> = ({ teamId }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { data, isLoading, isError, refetch } = useHistory(teamId);

  const handleBack = () => {
    navigate(`/?teamId=${teamId}${searchParams.get('gw') ? `&gw=${searchParams.get('gw')}` : ''}`);
  };

  return (
    <div className={styles.screen}>
      <ScreenHeader backLabel={copy.historyBack} onBack={handleBack} title={copy.historyTitle} />

      <div className={styles.body}>
        <span className={styles.sectionLabel}>{copy.historyThisSeason}</span>

        {isLoading && <HistorySkeleton />}

        {isError && (
          <div className={styles.stateCenter}>
            <p className={styles.stateText}>{copy.historyLoadError}</p>
            <Button variant="secondary" onClick={() => refetch()}>
              {copy.historyRetry}
            </Button>
          </div>
        )}

        {data && data.gameweeks.length === 0 && (
          <div className={styles.stateCenter}>
            <p className={styles.stateText}>{copy.historyEmpty}</p>
          </div>
        )}

        {data && data.gameweeks.length > 0 && <HistoryTable gameweeks={data.gameweeks} />}
      </div>
    </div>
  );
};

GameweekHistoryScreen.displayName = 'GameweekHistoryScreen';

function HistoryTable({ gameweeks }: { gameweeks: HistoryGameweek[] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{copy.historyColGW}</th>
            <th>{copy.historyColOR}</th>
            <th aria-label="Rank direction" />
            <th>{copy.historyColOP}</th>
            <th>{copy.historyColGWR}</th>
            <th>{copy.historyColGWP}</th>
            <th>{copy.historyColPB}</th>
            <th>{copy.historyColTM}</th>
            <th>{copy.historyColTC}</th>
            <th>{copy.historyColValue}</th>
          </tr>
        </thead>
        <tbody>
          {gameweeks.map((row, i) => {
            const prev = gameweeks[i + 1];
            return (
              <tr key={row.gw}>
                <td>GW{row.gw}</td>
                <td>{formatNumber(row.overallRank)}</td>
                <td>
                  <RankDir current={row.overallRank} previous={prev?.overallRank} />
                </td>
                <td>{row.overallPoints}</td>
                <td>{formatNumber(row.gwRank)}</td>
                <td>{row.gwPoints}</td>
                <td>{row.pointsOnBench}</td>
                <td>{row.transfers}</td>
                <td>{row.transferCost}</td>
                <td>{formatValue(row.teamValue)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const SKELETON_COLS = 10;
const SKELETON_ROWS = 10;

function HistorySkeleton() {
  return (
    <div className={styles.tableWrap} aria-label={copy.loadingPlaceholder} aria-busy="true">
      <table className={styles.skeletonTable}>
        <tbody>
          {Array.from({ length: SKELETON_ROWS }).map((_, r) => (
            <tr key={r} className={styles.skeletonRow}>
              {Array.from({ length: SKELETON_COLS }).map((_, c) => (
                <td key={c}>
                  <div
                    className={`${styles.skeletonCell} ${c === 0 ? styles.skeletonCellShort : styles.skeletonCellMed}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
