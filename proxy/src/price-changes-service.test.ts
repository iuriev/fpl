import { describe, expect, it } from 'vitest';

import { buildPriceChanges } from './price-changes-service';

const bootstrap = {
  teams: [
    { id: 1, short_name: 'ARS', name: 'Arsenal', code: 3 },
    { id: 2, short_name: 'MCI', name: 'City', code: 43 },
  ],
  elements: [
    {
      id: 1,
      web_name: 'Riser',
      team: 1,
      team_code: 3,
      element_type: 3,
      cost_change_event: 1,
      cost_change_start: 5,
      transfers_in_event: 100_000,
      transfers_out_event: 10_000,
      selected_by_percent: '10',
      now_cost: 80,
    },
    {
      id: 2,
      web_name: 'Faller',
      team: 2,
      team_code: 43,
      element_type: 4,
      cost_change_event: -1,
      cost_change_start: -2,
      transfers_in_event: 5_000,
      transfers_out_event: 90_000,
      selected_by_percent: '20',
      now_cost: 140,
    },
    {
      id: 3,
      web_name: 'Flat',
      team: 1,
      team_code: 3,
      element_type: 2,
      cost_change_event: 0,
      cost_change_start: 0,
      transfers_in_event: 0,
      transfers_out_event: 0,
      selected_by_percent: '5',
      now_cost: 50,
    },
  ],
  events: [],
} as never;

describe('buildPriceChanges', () => {
  it('returns gw risers excluding zero change', () => {
    const result = buildPriceChanges(bootstrap, 'gw', 'rise', 'all');
    expect(result.players).toHaveLength(1);
    expect(result.players[0].webName).toBe('Riser');
    expect(result.players[0].changeAmount).toBe(1);
  });

  it('filters by position', () => {
    const result = buildPriceChanges(bootstrap, 'gw', 'fall', 'FWD');
    expect(result.players).toHaveLength(1);
    expect(result.players[0].webName).toBe('Faller');
  });

  it('limits to squad player ids', () => {
    const result = buildPriceChanges(bootstrap, 'season', 'rise', 'all', new Set([3]));
    expect(result.players).toHaveLength(0);
  });
});
