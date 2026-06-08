import type { FPLBootstrapStatic } from '../fpl-client';
import { slugFromFplTeamName } from '../prediction/team-names';
import type {
  PlayerRegistry,
  PlayerSeasonEntry,
  TeamRegistry,
  TeamSeasonEntry,
  VaastavPlayerRow,
  VaastavTeamRow,
} from './types';

export function buildPlayerRegistry(players: readonly VaastavPlayerRow[]): PlayerRegistry {
  const byCode = new Map<number, PlayerSeasonEntry>();
  const elementToCode = new Map<number, number>();

  for (const player of players) {
    elementToCode.set(player.elementId, player.fplCode);
    byCode.set(player.fplCode, {
      elementId: player.elementId,
      webName: player.webName,
      firstName: player.firstName,
      secondName: player.secondName,
      teamCode: player.teamCode,
      elementType: player.elementType,
    });
  }

  return { byCode, elementToCode };
}

export function buildTeamRegistry(teams: readonly VaastavTeamRow[]): TeamRegistry {
  const byCode = new Map<number, TeamSeasonEntry>();
  const idToCode = new Map<number, number>();
  const slugToCode = new Map<string, number>();

  for (const team of teams) {
    idToCode.set(team.teamId, team.teamCode);
    const slug = slugFromFplTeamName(team.name) ?? slugFromFplTeamName(team.shortName);
    byCode.set(team.teamCode, {
      teamId: team.teamId,
      name: team.name,
      shortName: team.shortName,
      slug: slug ?? null,
    });
    if (slug) slugToCode.set(slug, team.teamCode);
  }

  return { byCode, idToCode, slugToCode };
}

export function buildRegistriesFromBootstrap(bootstrap: FPLBootstrapStatic): {
  playerRegistry: PlayerRegistry;
  teamRegistry: TeamRegistry;
} {
  const players: VaastavPlayerRow[] = bootstrap.elements.map((el) => ({
    elementId: el.id,
    fplCode: el.code,
    webName: el.web_name,
    firstName: el.first_name,
    secondName: el.second_name,
    elementType: el.element_type,
    teamId: el.team,
    teamCode: el.team_code,
  }));

  const teams: VaastavTeamRow[] = bootstrap.teams.map((t) => ({
    teamId: t.id,
    teamCode: t.code,
    name: t.name,
    shortName: t.short_name,
  }));

  return {
    playerRegistry: buildPlayerRegistry(players),
    teamRegistry: buildTeamRegistry(teams),
  };
}
