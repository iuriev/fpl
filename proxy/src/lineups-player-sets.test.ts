import { describe, expect, it } from 'vitest';

import type { FPLBootstrapStatic } from './fpl-client';
import {
  activeSquadElements,
  coldElementIds,
  hotElementIdsPerTeam,
} from './lineups-player-sets';

const bootstrap = {
  teams: [
    { id: 1, name: 'A', short_name: 'AAA', code: 1 },
    { id: 2, name: 'B', short_name: 'BBB', code: 2 },
  ],
  elements: [
    { id: 10, team: 1, minutes: 900, total_points: 50, element_type: 3 },
    { id: 11, team: 1, minutes: 100, total_points: 10, element_type: 3 },
    { id: 12, team: 1, minutes: 0, total_points: 0, element_type: 3 },
    { id: 20, team: 2, minutes: 500, total_points: 30, element_type: 2 },
    { id: 21, team: 2, minutes: 0, total_points: 1, element_type: 2 },
  ],
} as unknown as FPLBootstrapStatic;

describe('lineups-player-sets', () => {
  it('activeSquadElements excludes zero-minute zero-point players', () => {
    const squad = activeSquadElements(bootstrap, 1);
    expect(squad.map((e) => e.id)).toEqual([10, 11]);
  });

  it('hot tier prefers highest minutes per team', () => {
    const hot = hotElementIdsPerTeam(bootstrap, 1);
    expect(hot).toContain(10);
    expect(hot).not.toContain(11);
    expect(hot).toContain(20);
  });

  it('cold tier is active minus hot', () => {
    const hot = new Set(hotElementIdsPerTeam(bootstrap, 1));
    const cold = coldElementIds(bootstrap, hot);
    expect(cold).toContain(11);
    expect(cold).toContain(21);
    expect(cold).not.toContain(10);
  });
});
