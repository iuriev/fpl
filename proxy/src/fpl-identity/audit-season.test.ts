import { describe, expect, it } from 'vitest';

import { auditPlayers } from './audit-players';
import { auditTeams } from './audit-teams';
import type { VaastavPlayerRow, VaastavTeamRow } from './types';

describe('auditPlayers', () => {
  it('passes for consistent element↔code mapping', () => {
    const players: VaastavPlayerRow[] = [
      {
        elementId: 1,
        fplCode: 100,
        webName: 'Saka',
        firstName: 'Bukayo',
        secondName: 'Saka',
        elementType: 3,
        teamId: 1,
        teamCode: 3,
      },
    ];
    const { issues, registry } = auditPlayers(players, [1]);
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0);
    expect(registry.elementToCode.get(1)).toBe(100);
    expect(registry.byCode.get(100)?.elementId).toBe(1);
  });

  it('flags code mapped to multiple elements', () => {
    const players: VaastavPlayerRow[] = [
      {
        elementId: 1,
        fplCode: 100,
        webName: 'A',
        firstName: 'A',
        secondName: 'One',
        elementType: 3,
        teamId: 1,
        teamCode: 3,
      },
      {
        elementId: 2,
        fplCode: 100,
        webName: 'B',
        firstName: 'B',
        secondName: 'Two',
        elementType: 3,
        teamId: 1,
        teamCode: 3,
      },
    ];
    const { issues } = auditPlayers(players, [1, 2]);
    expect(issues.some((i) => i.code === 'CODE_MULTI_ELEMENT')).toBe(true);
  });

  it('flags merged_gw elements missing from players_raw', () => {
    const players: VaastavPlayerRow[] = [
      {
        elementId: 1,
        fplCode: 100,
        webName: 'Saka',
        firstName: 'Bukayo',
        secondName: 'Saka',
        elementType: 3,
        teamId: 1,
        teamCode: 3,
      },
    ];
    const { issues } = auditPlayers(players, [1, 999]);
    expect(issues.some((i) => i.code === 'MERGED_GW_UNKNOWN_ELEMENT')).toBe(true);
  });
});

describe('auditTeams', () => {
  it('flags team id mapped to multiple codes', async () => {
    const teams: VaastavTeamRow[] = [
      { teamId: 1, teamCode: 3, name: 'Arsenal', shortName: 'ARS' },
      { teamId: 1, teamCode: 7, name: 'Arsenal', shortName: 'ARS' },
    ];
    const { issues } = await auditTeams('2023-24', teams, [1], '/nonexistent');
    expect(issues.some((i) => i.code === 'TEAM_ID_MULTI_CODE')).toBe(true);
  });
});
