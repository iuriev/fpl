import * as cacheLayer from './cache';
import { db } from './db/client';
import * as fixturesService from './fixtures-service';
import { deriveSeason } from './fpl-cache/season';
import type { FPLElementSummary } from './fpl-client';
import { getOrFetchElementSummary } from './fpl-element-summary-cache';
import { getBootstrapWithCache, latestFinishedGw, POSITION_MAP } from './price-shared';
import type { PlayerPosition,PlayerProfileResponse, PlayerProfileStat } from './types';

const PROFILE_STAT_FIELDS: Array<{ key: keyof FPLElementSummary['history'][0]; identifier: string }> =
  [
    { key: 'goals_scored', identifier: 'goals_scored' },
    { key: 'assists', identifier: 'assists' },
    { key: 'clean_sheets', identifier: 'clean_sheets' },
    { key: 'bonus', identifier: 'bonus' },
    { key: 'saves', identifier: 'saves' },
    { key: 'penalties_saved', identifier: 'penalties_saved' },
    { key: 'penalties_missed', identifier: 'penalties_missed' },
    { key: 'own_goals', identifier: 'own_goals' },
    { key: 'yellow_cards', identifier: 'yellow_cards' },
    { key: 'red_cards', identifier: 'red_cards' },
    { key: 'defensive_contribution', identifier: 'defensive_contribution' },
  ];

function historyToStats(
  row: FPLElementSummary['history'][0]
): PlayerProfileStat[] {
  const stats: PlayerProfileStat[] = [];
  if (row.minutes > 0) {
    stats.push({ identifier: 'minutes', value: row.minutes });
  }
  for (const { key, identifier } of PROFILE_STAT_FIELDS) {
    const value = row[key] as number;
    if (value > 0) stats.push({ identifier, value });
  }
  return stats;
}

export async function getPlayerProfile(
  playerId: number,
  gwParam?: number
): Promise<PlayerProfileResponse> {
  const cacheKey = `player-profile:${playerId}:${gwParam ?? 'latest'}`;
  const cached = cacheLayer.get<PlayerProfileResponse>(cacheKey);
  if (cached) return cached;

  const bootstrap = await getBootstrapWithCache();
  const element = bootstrap.elements.find((e) => e.id === playerId);
  if (!element) throw new Error(`Player ${playerId} not found`);

  const team = bootstrap.teams.find((t) => t.id === element.team);
  const position = (POSITION_MAP[element.element_type] ?? 'GK') as PlayerPosition;

  const targetGw = gwParam ?? latestFinishedGw(bootstrap);
  const season = deriveSeason(bootstrap.events);
  const [summary, upcoming] = await Promise.all([
    getOrFetchElementSummary(db, season, playerId),
    fixturesService.getUpcomingFixtures(),
  ]);

  const gwRow =
    targetGw != null ? summary.history.find((h) => h.round === targetGw) : undefined;

  const result: PlayerProfileResponse = {
    player: {
      id: element.id,
      webName: element.web_name,
      position,
      teamCode: element.team_code,
      teamShortName: team?.short_name ?? '???',
      nowCost: element.now_cost,
      selectedByPercent: element.selected_by_percent,
      status: element.status as PlayerProfileResponse['player']['status'],
      news: element.news,
    },
    gw: gwRow ? targetGw : null,
    gwPoints: gwRow?.total_points ?? null,
    gwStats: gwRow ? historyToStats(gwRow) : [],
    nextFixtures: upcoming[element.team] ?? [],
  };

  cacheLayer.set(cacheKey, result, 600);
  return result;
}
