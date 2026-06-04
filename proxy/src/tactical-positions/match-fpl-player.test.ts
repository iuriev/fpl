import { describe, expect, it } from 'vitest';

import { matchFplPlayersToTm } from './match-fpl-player';

describe('matchFplPlayersToTm', () => {
  it('matches Magalhães Gabriel to Gabriel not Gabriel Jesus', () => {
    const fpl = [
      {
        code: 1,
        webName: 'Gabriel',
        firstName: 'Gabriel',
        secondName: 'Magalhães',
        squadNumber: 6,
      },
    ];
    const tm = [
      { id: '1', name: 'Gabriel Jesus', shirtNumber: 9 },
      { id: '2', name: 'Gabriel', shirtNumber: 6 },
    ];
    const { matched } = matchFplPlayersToTm(fpl, tm);
    expect(matched[0].tmId).toBe('2');
  });

  it('matches Saka by last name', () => {
    const fpl = [
      {
        code: 2,
        webName: 'Saka',
        firstName: 'Bukayo',
        secondName: 'Saka',
        squadNumber: 7,
      },
    ];
    const tm = [{ id: '3', name: 'Bukayo Saka', shirtNumber: 7 }];
    const { matched } = matchFplPlayersToTm(fpl, tm);
    expect(matched).toHaveLength(1);
    expect(matched[0].tmId).toBe('3');
  });
});
