import { describe, expect, it, vi } from 'vitest';

import { pickLineWithRoleQuotas } from './lineup-selection';
import type { RoleQuota } from './lineup-slot-requirements';
import { assignPlayersToSlots } from './player-lane-registry';
import { fillTierForRole } from './player-tactical-role';

vi.mock('./data/player-tactical-roles.json', () => ({
  default: {
    '901': { role: 'rw', lane: 'R', secondary: [] },
    '902': { role: 'rw', lane: 'R', secondary: ['lm'] },
    '903': { role: 'lw', lane: 'L', secondary: [] },
    '904': { role: 'am', lane: 'C', secondary: ['cm'] },
    '905': { role: 'cm', lane: 'C', secondary: [] },
    '906': { role: 'rm', lane: 'R', secondary: [] },
  },
}));

function mid(code: number, id: number, startScore: number) {
  return {
    el: {
      id,
      code,
      ep_next: '1.0',
      element_type: 3,
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
    startScore,
  };
}

const MID_4_QUOTAS: RoleQuota[] = [
  { kind: 'group', roles: ['dm', 'cm', 'am'], min: 2 },
  { kind: 'role', role: 'lm', min: 1 },
  { kind: 'role', role: 'rm', min: 1 },
];

describe('lineup-selection wing balance', () => {
  it('maps rw registry role to rm on the MID line', () => {
    expect(fillTierForRole(901, 'rm', 'MID')).toBe(0);
    expect(fillTierForRole(901, 'lm', 'MID')).toBe(3);
    expect(fillTierForRole(902, 'lm', 'MID')).toBe(1);
  });

  it('prefers a natural left winger over a second right winger in the squad', () => {
    const candidates = [
      mid(901, 1, 0.95),
      mid(902, 2, 0.88),
      mid(903, 3, 0.82),
      mid(904, 4, 0.8),
      mid(905, 5, 0.75),
    ];
    const picked = pickLineWithRoleQuotas(candidates, 4, MID_4_QUOTAS, 'MID');
    const codes = picked.map((p) => p.el.code);
    expect(codes).toContain(901);
    expect(codes).toContain(903);
    expect(codes).not.toContain(902);
  });

  it('uses the lower-rated rw with lm secondary on the left after the starter takes the right', () => {
    const candidates = [
      mid(901, 1, 0.95),
      mid(902, 2, 0.88),
      mid(904, 3, 0.8),
      mid(905, 4, 0.75),
    ];
    const picked = pickLineWithRoleQuotas(candidates, 4, MID_4_QUOTAS, 'MID');
    expect(picked.map((p) => p.el.code).sort()).toEqual([901, 902, 904, 905].sort());

    const assigned = assignPlayersToSlots(
      picked.map((p) => ({ id: p.el.id, code: p.el.code, startScore: p.startScore })),
      'MID',
      4
    );
    const byCode = new Map(assigned.map((a) => [a.code, a.lane]));
    expect(byCode.get(901)).toBe('R');
    expect(byCode.get(902)).toBe('L');
  });
});
