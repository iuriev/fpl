import type { FPLBootstrapStatic } from './fpl-client';
import {
  getBootstrapWithCache,
  matchesPosition,
  POSITION_MAP,
  type PositionFilter,
  TOP_PRICE_LIST,
} from './price-shared';
import type {
  PriceChangeDirection,
  PriceChangePeriod,
  PriceChangePlayer,
  PriceChangesResponse,
} from './types';

function changeAmount(
  el: FPLBootstrapStatic['elements'][0],
  period: PriceChangePeriod
): number {
  return period === 'gw' ? el.cost_change_event : el.cost_change_start;
}

function mapPlayer(
  el: FPLBootstrapStatic['elements'][0],
  teamShortName: string,
  amount: number
): PriceChangePlayer {
  return {
    id: el.id,
    webName: el.web_name,
    position: POSITION_MAP[el.element_type] ?? 'GK',
    teamCode: el.team_code,
    teamShortName,
    nowCost: el.now_cost,
    changeAmount: amount,
    transfersInEvent: el.transfers_in_event,
    transfersOutEvent: el.transfers_out_event,
    selectedByPercent: el.selected_by_percent,
  };
}

export function buildPriceChanges(
  bootstrap: FPLBootstrapStatic,
  period: PriceChangePeriod,
  direction: PriceChangeDirection,
  position: PositionFilter,
  playerIds?: Set<number>
): PriceChangesResponse {
  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));

  const filtered = bootstrap.elements
    .filter((el) => {
      if (playerIds && !playerIds.has(el.id)) return false;
      if (!matchesPosition(el.element_type, position)) return false;
      const amount = changeAmount(el, period);
      if (amount === 0) return false;
      return direction === 'rise' ? amount > 0 : amount < 0;
    })
    .map((el) => ({
      el,
      amount: changeAmount(el, period),
      teamShortName: teamMap.get(el.team) ?? '???',
    }));

  filtered.sort((a, b) =>
    direction === 'rise' ? b.amount - a.amount : a.amount - b.amount
  );

  const players = filtered
    .slice(0, TOP_PRICE_LIST)
    .map(({ el, amount, teamShortName }) => mapPlayer(el, teamShortName, amount));

  return { period, direction, players };
}

export async function getPriceChanges(
  period: PriceChangePeriod,
  direction: PriceChangeDirection,
  position: PositionFilter
): Promise<PriceChangesResponse> {
  const bootstrap = await getBootstrapWithCache();
  return buildPriceChanges(bootstrap, period, direction, position);
}

export async function getPriceChangesForSquad(
  period: PriceChangePeriod,
  direction: PriceChangeDirection,
  position: PositionFilter,
  playerIds: Set<number>
): Promise<PriceChangesResponse> {
  const bootstrap = await getBootstrapWithCache();
  return buildPriceChanges(bootstrap, period, direction, position, playerIds);
}
