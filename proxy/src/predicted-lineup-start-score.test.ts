import { describe, expect, it } from 'vitest';

import type { FPLBootstrapStatic } from './fpl-client';
import {
  computePredictedStartScore,
  effectivePredictedStartScore,
} from './predicted-lineup-start-score';

const baseEl = {
  chance_of_playing_next_round: 100,
  chance_of_playing_this_round: null,
  status: 'a',
} as FPLBootstrapStatic['elements'][number];

describe('computePredictedStartScore', () => {
  it('uses bootstrap minutes when element-summary is missing', () => {
    const el = { ...baseEl, minutes: 270 } as FPLBootstrapStatic['elements'][number];
    const withSummary = computePredictedStartScore(el, {
      history: [{ minutes: 90, starts: 1 } as never],
    } as never);
    const withoutSummary = computePredictedStartScore(el, undefined);
    expect(withoutSummary).toBeGreaterThan(0.2);
    expect(withoutSummary).toBeLessThanOrEqual(withSummary + 0.15);
  });

  it('returns near zero when there is no history and no season minutes', () => {
    const el = { ...baseEl, minutes: 0 } as FPLBootstrapStatic['elements'][number];
    expect(computePredictedStartScore(el, undefined)).toBeLessThan(0.35);
  });

  it('boosts player who started last match vs bench streak', () => {
    const el = { ...baseEl, minutes: 500 } as FPLBootstrapStatic['elements'][number];
    const startedLast = computePredictedStartScore(el, {
      history: [
        { minutes: 0, starts: 0 },
        { minutes: 0, starts: 0 },
        { minutes: 90, starts: 1 },
      ],
    } as never);
    const benchedTwice = computePredictedStartScore(el, {
      history: [
        { minutes: 90, starts: 1 },
        { minutes: 0, starts: 0 },
        { minutes: 0, starts: 0 },
      ],
    } as never);
    expect(startedLast).toBeGreaterThan(benchedTwice);
  });

  it('favours recent starts over old season streak', () => {
    const el = { ...baseEl, minutes: 800 } as FPLBootstrapStatic['elements'][number];
    const hotRecently = computePredictedStartScore(el, {
      history: [
        ...Array.from({ length: 5 }, () => ({ minutes: 0, starts: 0 })),
        { minutes: 90, starts: 1 },
        { minutes: 90, starts: 1 },
        { minutes: 90, starts: 1 },
      ],
    } as never);
    const coldRecently = computePredictedStartScore(el, {
      history: [
        { minutes: 90, starts: 1 },
        { minutes: 90, starts: 1 },
        { minutes: 90, starts: 1 },
        ...Array.from({ length: 5 }, () => ({ minutes: 0, starts: 0 })),
      ],
    } as never);
    expect(hotRecently).toBeGreaterThan(coldRecently);
  });

  it('penalises forwards who did not start last match', () => {
    const fwd = {
      ...baseEl,
      element_type: 4,
      minutes: 400,
    } as FPLBootstrapStatic['elements'][number];
    const raw = computePredictedStartScore(fwd, {
      history: [
        { minutes: 90, starts: 1 },
        { minutes: 30, starts: 0 },
      ],
    } as never);
    const effective = effectivePredictedStartScore(fwd, {
      history: [
        { minutes: 90, starts: 1 },
        { minutes: 30, starts: 0 },
      ],
    } as never);
    expect(effective).toBeLessThan(raw);
  });

  it('uses last-match priority for goalkeepers', () => {
    const gk = {
      ...baseEl,
      element_type: 1,
      minutes: 900,
    } as FPLBootstrapStatic['elements'][number];
    const starter = computePredictedStartScore(gk, {
      history: [
        { minutes: 0, starts: 0 },
        { minutes: 90, starts: 1 },
      ],
    } as never);
    const backup = computePredictedStartScore(gk, {
      history: [
        { minutes: 90, starts: 1 },
        { minutes: 0, starts: 0 },
      ],
    } as never);
    expect(starter).toBeGreaterThan(0.85);
    expect(starter).toBeGreaterThan(backup);
  });
});
