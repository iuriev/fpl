import * as fplClient from './fpl-client';
import * as gameweeksService from './gameweeks-service';

export async function getSquadPlayerIds(teamId: number): Promise<Set<number>> {
  const { current: gw } = await gameweeksService.getGameweeks();
  const picks = await fplClient.getPicks(teamId, gw);
  return new Set(picks.picks.map((p) => p.element));
}
