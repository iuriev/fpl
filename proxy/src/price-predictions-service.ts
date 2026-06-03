import type { FPLBootstrapStatic } from './fpl-client';
import {
  netTransfersEvent,
  predictLikelihood,
  thresholdForOwnership,
  transferInPercent,
} from './price-prediction';
import {
  getBootstrapWithCache,
  matchesPosition,
  POSITION_MAP,
  type PositionFilter,
  TOP_PRICE_LIST,
} from './price-shared';
import type {
  PredictionLikelihood,
  PricePredictionDirection,
  PricePredictionPlayer,
  PricePredictionsResponse,
} from './types';

function mapPredictionPlayer(
  el: FPLBootstrapStatic['elements'][0],
  teamShortName: string,
  net: number,
  likelihood: PredictionLikelihood
): PricePredictionPlayer {
  return {
    id: el.id,
    webName: el.web_name,
    position: POSITION_MAP[el.element_type] ?? 'GK',
    teamCode: el.team_code,
    teamShortName,
    nowCost: el.now_cost,
    transfersInEvent: el.transfers_in_event,
    transfersOutEvent: el.transfers_out_event,
    selectedByPercent: el.selected_by_percent,
    netTransfersEvent: net,
    transferInPercent: transferInPercent(el.transfers_in_event, el.transfers_out_event),
    likelihood,
  };
}

export function buildPricePredictions(
  bootstrap: FPLBootstrapStatic,
  direction: PricePredictionDirection,
  position: PositionFilter,
  playerIds?: Set<number>
): PricePredictionsResponse {
  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));

  const ranked = bootstrap.elements
    .filter((el) => {
      if (playerIds && !playerIds.has(el.id)) return false;
      if (!matchesPosition(el.element_type, position)) return false;
      const net = netTransfersEvent(el.transfers_in_event, el.transfers_out_event);
      const threshold = thresholdForOwnership(el.selected_by_percent);
      const likelihood = predictLikelihood(net, direction, threshold);
      return likelihood !== 'unlikely';
    })
    .map((el) => {
      const net = netTransfersEvent(el.transfers_in_event, el.transfers_out_event);
      const threshold = thresholdForOwnership(el.selected_by_percent);
      const likelihood = predictLikelihood(net, direction, threshold);
      return {
        el,
        net,
        likelihood,
        teamShortName: teamMap.get(el.team) ?? '???',
        sortKey: Math.abs(net),
      };
    });

  ranked.sort((a, b) => b.sortKey - a.sortKey);

  const players = ranked
    .slice(0, TOP_PRICE_LIST)
    .map(({ el, net, likelihood, teamShortName }) =>
      mapPredictionPlayer(el, teamShortName, net, likelihood)
    );

  return { direction, players };
}

export async function getPricePredictions(
  direction: PricePredictionDirection,
  position: PositionFilter
): Promise<PricePredictionsResponse> {
  const bootstrap = await getBootstrapWithCache();
  return buildPricePredictions(bootstrap, direction, position);
}

export async function getPricePredictionsForSquad(
  direction: PricePredictionDirection,
  position: PositionFilter,
  playerIds: Set<number>
): Promise<PricePredictionsResponse> {
  const bootstrap = await getBootstrapWithCache();
  return buildPricePredictions(bootstrap, direction, position, playerIds);
}
