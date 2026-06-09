import { describe, expect, it, vi } from 'vitest';

import { pickLineWithRoleQuotas } from './lineup-selection';

vi.mock('./player-tactical-role', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./player-tactical-role')>();
  const primary: Record<number, string> = {
    1: 'lb',
    2: 'cb',
    3: 'cb',
    4: 'rb',
    5: 'rb',
    6: 'cb',
  };
  const qualifies = (code: number, role: string) => primary[code] === role;
  return {
    ...actual,
    playerQualifiesForQuotaRole: qualifies,
    playerQualifiesForAnyQuotaRole: (code: number, roles: string[]) =>
      roles.some((r) => qualifies(code, r)),
    playerQualifiesForWingQuotaRole: qualifies,
    playerQualifiesForAnyWingQuotaRole: (code: number, roles: string[]) =>
      roles.some((r) => qualifies(code, r)),
    bestQuotaRoleMeritScore: (
      _code: number,
      _roles: string[],
      _line: string,
      baseMerit: number
    ) => baseMerit,
  };
});

function el(id: number, code: number) {
  return {
    el: {
      id,
      code,
      ep_next: '1.0',
      element_type: 2,
      web_name: `P${id}`,
      team: 1,
      team_code: 1,
      status: 'a',
      chance_of_playing_next_round: 100,
      chance_of_playing_this_round: null,
      news: '',
      minutes: 1000,
      total_points: 50,
      first_name: '',
      second_name: '',
      now_cost: 50,
      event_points: 0,
      form: '0',
      selected_by_percent: '0',
      cost_change_event: 0,
      cost_change_start: 0,
      transfers_in_event: 0,
      transfers_out_event: 0,
      price_change_percent: '0',
    },
    startScore: id / 10,
  };
}

describe('pickLineWithRoleQuotas', () => {
  it('enforces 2 cb + lb + rb for a back four', () => {
    const candidates = [el(10, 4), el(9, 5), el(8, 1), el(7, 6), el(6, 2), el(5, 3)];
    const picked = pickLineWithRoleQuotas(
      candidates,
      4,
      [
        { kind: 'role', role: 'cb', min: 2 },
        { kind: 'role', role: 'lb', min: 1 },
        { kind: 'role', role: 'rb', min: 1 },
      ],
      'DEF'
    );
    expect(picked).toHaveLength(4);
    const roles = picked.map((p) => p.el.code);
    expect(roles.filter((c) => c === 2 || c === 3 || c === 6)).toHaveLength(2);
    expect(roles).toContain(1);
    expect(roles.some((c) => c === 4 || c === 5)).toBe(true);
  });
});
