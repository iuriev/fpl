import { describe, expect, it } from 'vitest';

import { FplIdentityMapper } from './mapper';
import { resolveFdTeamSlug, softTeamSlugLookup } from './team-slug-lookup';
import type { PlayerRegistry, TeamRegistry } from './types';

function mapper(): FplIdentityMapper {
  const playerRegistry: PlayerRegistry = {
    byCode: new Map(),
    elementToCode: new Map(),
  };
  const teamRegistry: TeamRegistry = {
    byCode: new Map([
      [3, { teamId: 1, name: 'Arsenal', shortName: 'ARS', slug: 'arsenal' }],
    ]),
    idToCode: new Map([[1, 3]]),
    slugToCode: new Map([['arsenal', 3]]),
  };
  return new FplIdentityMapper('2023-24', playerRegistry, teamRegistry);
}

describe('softTeamSlugLookup', () => {
  it('resolves team id to slug', () => {
    const lookup = softTeamSlugLookup(mapper());
    expect(lookup(1)).toBe('arsenal');
  });

  it('returns undefined for unknown team id', () => {
    const lookup = softTeamSlugLookup(mapper());
    expect(lookup(99)).toBeUndefined();
  });
});

describe('resolveFdTeamSlug', () => {
  it('validates FD slug against season registry', () => {
    const m = mapper();
    expect(resolveFdTeamSlug('Arsenal', m)).toBe('arsenal');
    expect(resolveFdTeamSlug('Chelsea', m)).toBeUndefined();
  });
});
