import { describe, expect, it } from 'vitest';

import type { FPLBootstrapStatic } from '../fpl-client';
import { applyEpNextAnchorToTargetEvent } from './current-season';
import type { PlayerGwFactRow } from './types';

function makeBootstrap(epNextById: Record<number, string>): FPLBootstrapStatic {
  return {
    elements: Object.entries(epNextById).map(([id, ep_next]) => ({
      id: Number(id),
      ep_next,
    })),
  } as FPLBootstrapStatic;
}

function fact(round: number, element: number, xp = 0): PlayerGwFactRow {
  return {
    season: '2025-26',
    round,
    element,
    fixture: round * 100 + element,
    teamId: 1,
    position: 'MID',
    minutes: 90,
    starts: 1,
    goals: 0,
    assists: 0,
    totalPoints: 0,
    xp,
    expectedGoals: 0,
    expectedAssists: 0,
    opponentTeam: 2,
    wasHome: true,
  };
}

describe('applyEpNextAnchorToTargetEvent', () => {
  it('sets xp from bootstrap ep_next only on target-event rows', () => {
    const bootstrap = makeBootstrap({ 10: '5.5', 11: '3.0' });
    const facts = [fact(37, 10), fact(38, 10), fact(38, 11), fact(39, 10)];

    const out = applyEpNextAnchorToTargetEvent(facts, bootstrap, 38);

    expect(out[0].xp).toBe(0);
    expect(out[1].xp).toBe(5.5);
    expect(out[2].xp).toBe(3);
    expect(out[3].xp).toBe(0);
  });

  it('treats missing or invalid ep_next as 0', () => {
    const bootstrap = makeBootstrap({ 10: '', 11: 'n/a' });
    const facts = [fact(38, 10), fact(38, 11)];

    const out = applyEpNextAnchorToTargetEvent(facts, bootstrap, 38);

    expect(out[0].xp).toBe(0);
    expect(out[1].xp).toBe(0);
  });
});
