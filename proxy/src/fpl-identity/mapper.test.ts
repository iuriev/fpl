import { describe, expect, it } from 'vitest';

import { buildPlayerRegistry, buildTeamRegistry } from './build-registry';
import { FplIdentityError } from './errors';
import { FplIdentityMapper } from './mapper';
import type { VaastavPlayerRow, VaastavTeamRow } from './types';

const players: VaastavPlayerRow[] = [
  {
    elementId: 100,
    fplCode: 9001,
    webName: 'Saka',
    firstName: 'Bukayo',
    secondName: 'Saka',
    elementType: 3,
    teamId: 1,
    teamCode: 3,
  },
];

const teams: VaastavTeamRow[] = [
  { teamId: 1, teamCode: 3, name: 'Arsenal', shortName: 'ARS' },
];

function mapper(): FplIdentityMapper {
  return new FplIdentityMapper(
    '2023-24',
    buildPlayerRegistry(players),
    buildTeamRegistry(teams),
  );
}

describe('FplIdentityMapper', () => {
  it('resolves element id ↔ fpl code', () => {
    const m = mapper();
    expect(m.playerCode(100)).toBe(9001);
    expect(m.playerElementId(9001)).toBe(100);
  });

  it('resolves team id ↔ team code ↔ slug', () => {
    const m = mapper();
    expect(m.teamCode(1)).toBe(3);
    expect(m.teamId(3)).toBe(1);
    expect(m.teamSlug(1)).toBe('arsenal');
    expect(m.slugToTeamCode('arsenal')).toBe(3);
  });

  it('throws on unknown element in strict attach', () => {
    const m = mapper();
    expect(() => m.attachFplCodes([{ seasonElementId: 999, x: 1 }])).toThrow(FplIdentityError);
  });

  it('attachFplCodes succeeds when all elements map', () => {
    const m = mapper();
    expect(m.attachFplCodes([{ seasonElementId: 100, x: 1 }])).toEqual([
      { seasonElementId: 100, x: 1, fplCode: 9001 },
    ]);
  });
});
