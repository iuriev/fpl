import { describe, expect, it } from 'vitest';

import type { FPLBootstrapStatic, FPLElementSummary, FPLFixture } from './fpl-client';
import { buildLastMatchLaneMap } from './last-match-lanes';

function fixture(id: number, event: number, teamH: number, teamA: number): FPLFixture {
  return {
    id,
    event,
    finished: true,
    team_h: teamH,
    team_a: teamA,
    kickoff_time: '2025-01-01T15:00:00Z',
  } as FPLFixture;
}

describe('buildLastMatchLaneMap', () => {
  it('returns lanes from the most recent finished match before target GW', () => {
    const teamId = 1;
    const allFixtures = [fixture(100, 9, teamId, 2), fixture(200, 11, teamId, 2)];
    const bootstrap = {
      elements: [
        {
          id: 10,
          code: 1000,
          team: teamId,
          element_type: 2,
          web_name: 'LB',
        },
        {
          id: 11,
          code: 1001,
          team: teamId,
          element_type: 2,
          web_name: 'RB',
        },
      ],
    } as FPLBootstrapStatic;

    const summaries = new Map<number, FPLElementSummary>([
      [
        10,
        {
          history: [{ fixture: 100, minutes: 90, starts: 1, round: 9 } as never],
        },
      ],
      [
        11,
        {
          history: [{ fixture: 100, minutes: 90, starts: 1, round: 9 } as never],
        },
      ],
    ]);

    const lanes = buildLastMatchLaneMap(teamId, bootstrap, summaries, allFixtures, 11);
    expect(lanes.size).toBe(2);
    expect(lanes.get(10)).toMatch(/^[LCR]$/);
    expect(lanes.get(11)).toMatch(/^[LCR]$/);
  });
});
