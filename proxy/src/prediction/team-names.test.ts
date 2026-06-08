import { describe, expect, it } from 'vitest';

import { buildFplTeamIdToSlug, mergeTeamIdToSlug } from './team-names';

describe('buildFplTeamIdToSlug', () => {
  it('maps bootstrap team ids to poisson slugs', () => {
    const map = buildFplTeamIdToSlug([
      { id: 12, name: 'Liverpool' },
      { id: 5, name: 'Brighton' },
      { id: 14, name: 'Man Utd' },
    ]);

    expect(map.get(12)).toBe('liverpool');
    expect(map.get(5)).toBe('brighton');
    expect(map.get(14)).toBe('man-united');
  });

  it('maps Luton from vaastav name', () => {
    const map = buildFplTeamIdToSlug([{ id: 12, name: 'Luton' }]);
    expect(map.get(12)).toBe('luton');
  });
});

describe('mergeTeamIdToSlug', () => {
  it('overlays bootstrap ids onto stale alias rows', () => {
    const merged = mergeTeamIdToSlug(
      [{ fplTeamId: 11, slug: 'liverpool' }],
      [{ id: 12, name: 'Liverpool' }],
    );

    expect(merged.get(11)).toBe('liverpool');
    expect(merged.get(12)).toBe('liverpool');
  });
});
