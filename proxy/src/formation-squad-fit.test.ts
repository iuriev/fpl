import { describe, expect, it } from 'vitest';

import type { InferredFormation } from './formation-inference';
import {
  adjustFormationForSquad,
  countEligibleByLine,
  formationFitsSquad,
} from './formation-squad-fit';

function inferred(counts: { def: number; mid: number; fwd: number }): InferredFormation {
  const label = `${counts.def}-${counts.mid}-${counts.fwd}`;
  return { counts, label, source: 'recent_fixtures' };
}

describe('formation-squad-fit', () => {
  it('keeps 4-3-3 when squad has enough FPL forwards', () => {
    const avail = { gk: 2, def: 8, mid: 10, fwd: 4 };
    const form = inferred({ def: 4, mid: 3, fwd: 3 });
    expect(adjustFormationForSquad(form, avail)).toEqual(form);
  });

  it('shifts to 4-5-1 when only one FPL forward is available', () => {
    const avail = { gk: 2, def: 8, mid: 12, fwd: 1 };
    const form = inferred({ def: 4, mid: 3, fwd: 3 });
    const adjusted = adjustFormationForSquad(form, avail);
    expect(adjusted.counts).toEqual({ def: 4, mid: 5, fwd: 1 });
    expect(adjusted.label).toBe('4-5-1');
    expect(adjusted.source).toBe('squad_fit');
    expect(formationFitsSquad(adjusted.counts, avail)).toBe(true);
  });

  it('prefers 4-4-2 over 4-5-1 when two forwards are available', () => {
    const avail = { gk: 2, def: 8, mid: 10, fwd: 2 };
    const form = inferred({ def: 4, mid: 3, fwd: 3 });
    const adjusted = adjustFormationForSquad(form, avail);
    expect(adjusted.counts).toEqual({ def: 4, mid: 4, fwd: 2 });
    expect(adjusted.label).toBe('4-4-2');
  });

  it('counts eligible players by FPL element type', () => {
    const squad = [
      { element_type: 1, status: 'a', chance_of_playing_next_round: 100, chance_of_playing_this_round: null, news: '' },
      { element_type: 4, status: 'a', chance_of_playing_next_round: 100, chance_of_playing_this_round: null, news: '' },
      { element_type: 4, status: 'u', chance_of_playing_next_round: null, chance_of_playing_this_round: null, news: '' },
      { element_type: 3, status: 'a', chance_of_playing_next_round: 100, chance_of_playing_this_round: null, news: '' },
    ] as Parameters<typeof countEligibleByLine>[0];
    expect(countEligibleByLine(squad, null)).toEqual({ gk: 1, def: 0, mid: 1, fwd: 1 });
  });
});
