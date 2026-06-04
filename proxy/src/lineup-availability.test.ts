import { describe, expect, it } from 'vitest';

import {
  fixtureAvailabilityCutoff,
  hasInjuryWarning,
  isExcludedFromPredictedLineup,
  parseExpectedReturnDate,
} from './lineup-availability';

describe('lineup-availability', () => {
  it('parses expected return from FPL-style news', () => {
    const d = parseExpectedReturnDate('Knee injury - Expected back 10 Jun', new Date('2026-05-01'));
    expect(d?.toISOString().slice(0, 10)).toBe('2026-06-10');
  });

  it('excludes injured player when return is after day-before cutoff', () => {
    const kickoff = '2026-06-14T15:00:00Z';
    const cutoff = fixtureAvailabilityCutoff(kickoff);
    expect(cutoff?.toISOString()).toBe('2026-06-13T15:00:00.000Z');

    expect(
      isExcludedFromPredictedLineup(
        {
          status: 'i',
          chance_of_playing_next_round: 25,
          chance_of_playing_this_round: null,
          news: 'Hamstring - Expected back 14 Jun',
        },
        kickoff,
        new Date('2026-06-01')
      )
    ).toBe(true);
  });

  it('excludes suspended and zero chance players', () => {
    expect(
      isExcludedFromPredictedLineup(
        {
          status: 's',
          chance_of_playing_next_round: null,
          chance_of_playing_this_round: null,
          news: '',
        },
        '2026-06-14T15:00:00Z'
      )
    ).toBe(true);

    expect(
      isExcludedFromPredictedLineup(
        {
          status: 'a',
          chance_of_playing_next_round: 0,
          chance_of_playing_this_round: 0,
          news: '',
        },
        '2026-06-14T15:00:00Z'
      )
    ).toBe(true);
  });

  it('flags doubtful players still in the lineup', () => {
    expect(
      hasInjuryWarning(
        {
          status: 'd',
          chance_of_playing_next_round: 75,
          chance_of_playing_this_round: null,
          news: 'Knock',
        },
        '2026-06-14T15:00:00Z'
      )
    ).toBe(true);
  });
});
