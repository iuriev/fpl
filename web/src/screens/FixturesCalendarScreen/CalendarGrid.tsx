import React, { useEffect, useRef } from 'react';

import type { CalendarGameweek, CalendarResponse, TeamGwRow } from '@/types';

import styles from './CalendarGrid.module.css';
import type { CalendarMode } from './FixtureCell';
import { FixtureCell } from './FixtureCell';

const COL_NORMAL = '5.5rem';
const COL_DGW = '11.125rem';

interface CalendarGridProps {
  data: CalendarResponse;
  mode: CalendarMode;
}

function isDgwGw(gw: CalendarGameweek, byTeam: CalendarResponse['byTeam']): boolean {
  return Object.values(byTeam).some((rows) => {
    const row = rows.find((r) => r.gw === gw.id);
    return row ? row.fixtures.length >= 2 : false;
  });
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ data, mode }) => {
  const { teams, gameweeks, byTeam } = data;
  const currentGwRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentGwRef.current) {
      requestAnimationFrame(() => {
        currentGwRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
      });
    }
  }, []);

  const dgwSet = new Set(gameweeks.filter((gw) => isDgwGw(gw, byTeam)).map((gw) => gw.id));

  const colTemplate =
    'auto ' +
    gameweeks.map((gw) => (dgwSet.has(gw.id) ? COL_DGW : COL_NORMAL)).join(' ');

  return (
    <div className={styles.wrapper}>
      <div className={styles.grid} style={{ gridTemplateColumns: colTemplate }}>
        {/* Top-left corner cell */}
        <div className={`${styles.cornerCell} ${styles.stickyLeft} ${styles.stickyTop}`} />

        {/* GW header row */}
        {gameweeks.map((gw) => (
          <div
            key={gw.id}
            ref={gw.isCurrent ? currentGwRef : undefined}
            className={`${styles.gwHeader} ${styles.stickyTop} ${gw.isCurrent ? styles.gwHeaderCurrent : ''}`}
          >
            <div className={styles.gwRow}>
              <span className={styles.gwLabel}>GW</span>
              <span className={styles.gwNumber}>{gw.id}</span>
            </div>
            {gw.isCurrent && <span className={styles.gwCurrentDot} />}
          </div>
        ))}

        {/* Team rows */}
        {teams.map((team) => {
          const rows: TeamGwRow[] = byTeam[team.id] ?? [];
          return (
            <React.Fragment key={team.id}>
              <div className={`${styles.teamCell} ${styles.stickyLeft}`}>
                {team.shortName}
              </div>

              {gameweeks.map((gw) => {
                const row = rows.find((r) => r.gw === gw.id);
                return (
                  <div key={gw.id} className={styles.cellWrapper}>
                    <FixtureCell
                      fixtures={row?.fixtures ?? []}
                      mode={mode}
                      isDgwCol={dgwSet.has(gw.id)}
                    />
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

CalendarGrid.displayName = 'CalendarGrid';
