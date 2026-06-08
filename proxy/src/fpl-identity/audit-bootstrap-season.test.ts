import { describe, expect, it } from 'vitest';

import type { FPLBootstrapStatic } from '../fpl-client';
import { auditBootstrapSeasonIdentity } from './audit-bootstrap-season';

function mockBootstrap(): FPLBootstrapStatic {
  return {
    total_players: 1,
    chips: [],
    events: [
      {
        id: 1,
        name: 'Gameweek 1',
        deadline_time: '2025-08-15T17:30:00Z',
        is_current: false,
        is_next: true,
        finished: false,
        data_checked: false,
        average_entry_score: 0,
        highest_score: 0,
      },
    ],
    teams: [
      {
        id: 1,
        name: 'Arsenal',
        short_name: 'ARS',
        code: 3,
        strength_overall_home: 0,
        strength_overall_away: 0,
        strength_attack_home: 0,
        strength_attack_away: 0,
        strength_defence_home: 0,
        strength_defence_away: 0,
      },
    ],
    elements: [
      {
        id: 10,
        web_name: 'Saka',
        team: 1,
        team_code: 3,
        element_type: 3,
        status: 'a',
        chance_of_playing_this_round: null,
        chance_of_playing_next_round: null,
        minutes: 0,
        code: 9001,
        news: '',
        total_points: 0,
        first_name: 'Bukayo',
        second_name: 'Saka',
        now_cost: 100,
        event_points: 0,
        form: '0',
        selected_by_percent: '0',
        ep_next: '0',
        cost_change_event: 0,
        cost_change_start: 0,
        transfers_in_event: 0,
        transfers_out_event: 0,
        price_change_percent: '0',
      },
    ],
    element_types: [{ id: 3, singular_name_short: 'MID' }],
  };
}

describe('auditBootstrapSeasonIdentity', () => {
  it('passes for consistent bootstrap snapshot', async () => {
    const result = await auditBootstrapSeasonIdentity(mockBootstrap(), '2025-26', '/nonexistent');
    expect(result.ok).toBe(true);
    expect(result.source).toBe('bootstrap');
    expect(result.playerRegistry.byCode.size).toBe(1);
  });
});
