import { teamFinishedFixtures } from './formation-inference';
import type { FPLBootstrapStatic, FPLElementSummary, FPLFixture } from './fpl-client';
import {
  assignPlayersToSlots,
  type LaneAssignablePlayer,
  type PlayerLane,
} from './player-lane-registry';

type OutfieldLine = 'DEF' | 'MID' | 'FWD';

function rowStarted(minutes: number, starts: number): boolean {
  return starts > 0 || (starts === 0 && minutes >= 60);
}

export function lastFinishedFixtureBeforeGw(
  teamId: number,
  allFixtures: FPLFixture[],
  beforeGw: number
): FPLFixture | null {
  const finished = teamFinishedFixtures(teamId, allFixtures).filter(
    (f) => f.event < beforeGw
  );
  return finished[0] ?? null;
}

export function buildLastMatchLaneMap(
  teamId: number,
  bootstrap: FPLBootstrapStatic,
  summaries: Map<number, FPLElementSummary>,
  allFixtures: FPLFixture[],
  beforeGw: number
): Map<number, PlayerLane> {
  const fixture = lastFinishedFixtureBeforeGw(teamId, allFixtures, beforeGw);
  if (!fixture) return new Map();

  const byLine: Record<OutfieldLine, LaneAssignablePlayer[]> = {
    DEF: [],
    MID: [],
    FWD: [],
  };

  for (const el of bootstrap.elements) {
    if (el.team !== teamId) continue;
    const row = summaries.get(el.id)?.history.find((h) => h.fixture === fixture.id);
    if (!row || !rowStarted(row.minutes, row.starts)) continue;
    if (el.element_type === 2) {
      byLine.DEF.push({ id: el.id, code: el.code, startScore: 1 });
    } else if (el.element_type === 3) {
      byLine.MID.push({ id: el.id, code: el.code, startScore: 1 });
    } else if (el.element_type === 4) {
      byLine.FWD.push({ id: el.id, code: el.code, startScore: 1 });
    }
  }

  const lanes = new Map<number, PlayerLane>();
  for (const line of ['DEF', 'MID', 'FWD'] as const) {
    const pool = byLine[line];
    if (pool.length === 0) continue;
    const assigned = assignPlayersToSlots(pool, line, pool.length);
    for (const a of assigned) lanes.set(a.id, a.lane);
  }
  return lanes;
}
