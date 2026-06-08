import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as cache from './cache';
import * as fixturesService from './fixtures-service';
import * as dbCache from './fpl-cache/db-cache';
import * as elementSummaryCache from './fpl-element-summary-cache';
import * as playerProfileService from './player-profile-service';

vi.mock('./db/client', () => ({ db: {} }));
vi.mock('./fpl-cache/db-cache');
vi.mock('./fpl-element-summary-cache');
vi.mock('./cache');
vi.mock('./fixtures-service');

const bootstrap = {
  events: [
    {
      id: 1,
      finished: true,
      is_current: false,
      deadline_time: '2025-08-15T17:30:00Z',
    },
    { id: 37, finished: true, is_current: false, deadline_time: '2026-04-01T17:30:00Z' },
    { id: 38, finished: false, is_current: true, deadline_time: '2026-05-01T17:30:00Z' },
  ],
  teams: [{ id: 1, short_name: 'ARS', name: 'Arsenal', code: 3 }],
  elements: [
    {
      id: 100,
      web_name: 'Saka',
      team: 1,
      team_code: 3,
      element_type: 3,
      status: 'a',
      news: '',
      now_cost: 95,
      selected_by_percent: '30',
    },
  ],
} as never;

describe('getPlayerProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cache.get).mockReturnValue(null);
    vi.mocked(cache.set).mockReturnValue(undefined);
    vi.mocked(dbCache.getOrFetchBootstrap).mockResolvedValue(bootstrap);
    vi.mocked(fixturesService.getUpcomingFixtures).mockResolvedValue({
      1: [{ gw: 39, opponent: 'MCI', home: true, difficulty: 4 }],
    });
  });

  it('maps last finished GW stats from element-summary', async () => {
    vi.mocked(elementSummaryCache.getOrFetchElementSummary).mockResolvedValue({
      history: [
        {
          fixture: 1,
          round: 37,
          opponent_team: 2,
          was_home: true,
          kickoff_time: '2026-05-20T19:00:00Z',
          total_points: 8,
          minutes: 90,
          starts: 1,
          goals_scored: 1,
          assists: 0,
          clean_sheets: 0,
          goals_conceded: 0,
          own_goals: 0,
          penalties_saved: 0,
          penalties_missed: 0,
          yellow_cards: 0,
          red_cards: 0,
          saves: 0,
          bonus: 2,
          bps: 30,
          defensive_contribution: 0,
          expected_goals: 0,
          expected_assists: 0,
        },
      ],
    });

    const result = await playerProfileService.getPlayerProfile(100);

    expect(result.gw).toBe(37);
    expect(result.gwPoints).toBe(8);
    expect(result.gwStats.some((s) => s.identifier === 'goals_scored')).toBe(true);
    expect(result.nextFixtures).toHaveLength(1);
  });

  it('returns profile without GW block when history missing', async () => {
    vi.mocked(elementSummaryCache.getOrFetchElementSummary).mockResolvedValue({ history: [] });

    const result = await playerProfileService.getPlayerProfile(100);

    expect(result.gw).toBeNull();
    expect(result.gwPoints).toBeNull();
    expect(result.gwStats).toEqual([]);
    expect(result.player.webName).toBe('Saka');
  });

  it('throws when player not in bootstrap', async () => {
    await expect(playerProfileService.getPlayerProfile(999)).rejects.toThrow(/not found/);
  });
});
