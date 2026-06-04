import { describe, expect, it } from 'vitest';

import { formationLabel, type InferredFormation } from './formation-inference';
import { countEligibleByLine } from './formation-squad-fit';
import type { FPLBootstrapStatic } from './fpl-client';
import type { ScoredLineupCandidate } from './lineup-selection';
import {
  pickFormationByLineupScore,
  scoreLineupForFormation,
} from './predicted-lineup-formation-pick';

function el(
  id: number,
  elementType: number,
  ep = '5.0'
): FPLBootstrapStatic['elements'][number] {
  return {
    id,
    code: id * 100,
    element_type: elementType,
    web_name: `P${id}`,
    team_code: 1,
    ep_next: ep,
    chance_of_playing_next_round: 100,
    chance_of_playing_this_round: null,
    status: 'a',
    minutes: 900,
  } as FPLBootstrapStatic['elements'][number];
}

function squad(): FPLBootstrapStatic['elements'][number][] {
  return [
    el(1, 1),
    el(2, 2),
    el(3, 2),
    el(4, 2),
    el(5, 2),
    el(6, 2),
    el(7, 3),
    el(8, 3),
    el(9, 3),
    el(10, 3),
    el(11, 3),
    el(12, 3),
    el(13, 4),
    el(14, 4),
    el(15, 4),
  ];
}

describe('pickFormationByLineupScore', () => {
  it('does not keep a weak historical shape when another valid shape scores higher', () => {
    const inferred: InferredFormation = {
      counts: { def: 5, mid: 4, fwd: 1 },
      label: '5-4-1',
      source: 'recent_fixtures',
    };
    const scored: ScoredLineupCandidate[] = squad().map((player) => ({
      el: player,
      startScore:
        player.element_type === 4
          ? 0.95
          : player.element_type === 3
            ? 0.35
            : 0.45,
    }));
    const avail = countEligibleByLine(squad(), null);
    const picked = pickFormationByLineupScore(inferred, avail, scored, null);
    const historicalScore = scoreLineupForFormation(scored, inferred.counts, null);
    const pickedScore = scoreLineupForFormation(scored, picked.counts, null);
    expect(picked.source).toBe('lineup_fit');
    expect(pickedScore).toBeGreaterThanOrEqual(historicalScore);
    expect(picked.label).not.toBe('5-4-1');
  });

  it('scores higher when strong forwards fit a three-man attack', () => {
    const scored: ScoredLineupCandidate[] = squad().map((player) => ({
      el: player,
      startScore: player.element_type === 4 ? 0.9 : 0.5,
    }));
    const threeFwd = scoreLineupForFormation(scored, { def: 4, mid: 3, fwd: 3 }, null);
    const oneFwd = scoreLineupForFormation(scored, { def: 5, mid: 4, fwd: 1 }, null);
    expect(threeFwd).toBeGreaterThan(oneFwd);
  });
});
