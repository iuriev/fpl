import { describe, expect, it } from 'vitest';

import { auditCrossSeasonIdentity } from './audit-cross-season';
import { buildPlayerRegistry, buildTeamRegistry } from './build-registry';
import type { VaastavPlayerRow, VaastavTeamRow } from './types';

describe('auditCrossSeasonIdentity', () => {
  it('passes when shared fpl code refers to same player', () => {
    const playerA: VaastavPlayerRow = {
      elementId: 1,
      fplCode: 100,
      webName: 'Saka',
      firstName: 'Bukayo',
      secondName: 'Saka',
      elementType: 3,
      teamId: 1,
      teamCode: 3,
    };
    const playerB: VaastavPlayerRow = {
      elementId: 50,
      fplCode: 100,
      webName: 'Saka',
      firstName: 'Bukayo',
      secondName: 'Saka',
      elementType: 3,
      teamId: 1,
      teamCode: 3,
    };
    const team: VaastavTeamRow = { teamId: 1, teamCode: 3, name: 'Arsenal', shortName: 'ARS' };
    const result = auditCrossSeasonIdentity(
      '2023-24',
      '2024-25',
      buildPlayerRegistry([playerA]),
      buildTeamRegistry([team]),
      buildPlayerRegistry([playerB]),
      buildTeamRegistry([team]),
    );
    expect(result.ok).toBe(true);
    expect(result.stats.playerCodesBoth).toBe(1);
  });

  it('flags conflicting identity for same fpl code', () => {
    const playerA: VaastavPlayerRow = {
      elementId: 1,
      fplCode: 100,
      webName: 'Saka',
      firstName: 'Bukayo',
      secondName: 'Saka',
      elementType: 3,
      teamId: 1,
      teamCode: 3,
    };
    const playerB: VaastavPlayerRow = {
      elementId: 2,
      fplCode: 100,
      webName: 'Haaland',
      firstName: 'Erling',
      secondName: 'Haaland',
      elementType: 4,
      teamId: 2,
      teamCode: 43,
    };
    const team: VaastavTeamRow = { teamId: 1, teamCode: 3, name: 'Arsenal', shortName: 'ARS' };
    const result = auditCrossSeasonIdentity(
      '2023-24',
      '2024-25',
      buildPlayerRegistry([playerA]),
      buildTeamRegistry([team]),
      buildPlayerRegistry([playerB]),
      buildTeamRegistry([team]),
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === 'CODE_PLAYER_IDENTITY_CONFLICT')).toBe(true);
  });
});
