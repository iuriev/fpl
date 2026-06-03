import { describe, expect, it } from 'vitest';

import { buildPricePredictions } from './price-predictions-service';

const bootstrap = {
  teams: [{ id: 1, short_name: 'ARS', name: 'Arsenal', code: 3 }],
  elements: [
    {
      id: 1,
      web_name: 'Hot',
      team: 1,
      team_code: 3,
      element_type: 3,
      now_cost: 80,
      selected_by_percent: '10',
      transfers_in_event: 120_000,
      transfers_out_event: 5_000,
    },
    {
      id: 2,
      web_name: 'Cold',
      team: 1,
      team_code: 3,
      element_type: 3,
      now_cost: 70,
      selected_by_percent: '10',
      transfers_in_event: 1_000,
      transfers_out_event: 2_000,
    },
  ],
  events: [],
} as never;

describe('buildPricePredictions', () => {
  it('lists likely risers sorted by net transfers', () => {
    const result = buildPricePredictions(bootstrap, 'rise', 'all');
    expect(result.players.length).toBeGreaterThan(0);
    expect(result.players[0].webName).toBe('Hot');
    expect(result.players[0].likelihood).not.toBe('unlikely');
  });

  it('excludes unlikely players', () => {
    const result = buildPricePredictions(bootstrap, 'rise', 'all');
    expect(result.players.every((p) => p.id !== 2)).toBe(true);
  });
});
