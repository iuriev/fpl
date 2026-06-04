import { describe, expect, it } from 'vitest';

import {
  csProbHome,
  fitTeamPoisson,
  lambdaHome,
} from './team-poisson';
import type { EplMatchRow } from './types';

const SAMPLE: EplMatchRow[] = [
  {
    season: '2024-25',
    matchDate: '2024-08-16',
    homeSlug: 'man-united',
    awaySlug: 'fulham',
    fthg: 1,
    ftag: 0,
    ftr: 'H',
  },
  {
    season: '2024-25',
    matchDate: '2024-08-17',
    homeSlug: 'arsenal',
    awaySlug: 'wolves',
    fthg: 2,
    ftag: 0,
    ftr: 'H',
  },
  {
    season: '2024-25',
    matchDate: '2024-08-17',
    homeSlug: 'liverpool',
    awaySlug: 'bournemouth',
    fthg: 2,
    ftag: 1,
    ftr: 'H',
  },
];

describe('fitTeamPoisson', () => {
  it('produces positive lambdas and cs prob between 0 and 1', () => {
    const fit = fitTeamPoisson(SAMPLE);
    const lam = lambdaHome(fit, 'arsenal', 'wolves');
    expect(lam).toBeGreaterThan(0);
    const cs = csProbHome(fit, 'arsenal', 'wolves');
    expect(cs).toBeGreaterThan(0);
    expect(cs).toBeLessThan(1);
  });
});
