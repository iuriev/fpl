import { slugFromFd, slugFromVaastav } from '../prediction/team-names';
import { FplIdentityError } from './errors';
import type { PlayerRegistry, PlayerSeasonEntry, TeamRegistry, TeamSeasonEntry } from './types';

export class FplIdentityMapper {
  readonly season: string;

  constructor(
    season: string,
    private readonly playerRegistry: PlayerRegistry,
    private readonly teamRegistry: TeamRegistry,
  ) {
    this.season = season;
  }

  playerCode(elementId: number): number {
    const code = this.playerRegistry.elementToCode.get(elementId);
    if (code === undefined) {
      throw new FplIdentityError(
        'PLAYER_ELEMENT_UNKNOWN',
        `Unknown player element ${elementId} in season ${this.season}`,
        { season: this.season, elementId },
      );
    }
    return code;
  }

  playerElementId(fplCode: number): number {
    const entry = this.playerRegistry.byCode.get(fplCode);
    if (!entry) {
      throw new FplIdentityError(
        'PLAYER_CODE_UNKNOWN',
        `Unknown player code ${fplCode} in season ${this.season}`,
        { season: this.season, fplCode },
      );
    }
    return entry.elementId;
  }

  playerEntry(fplCode: number): PlayerSeasonEntry {
    const entry = this.playerRegistry.byCode.get(fplCode);
    if (!entry) {
      throw new FplIdentityError(
        'PLAYER_CODE_UNKNOWN',
        `Unknown player code ${fplCode} in season ${this.season}`,
        { season: this.season, fplCode },
      );
    }
    return entry;
  }

  teamCode(teamId: number): number {
    const code = this.teamRegistry.idToCode.get(teamId);
    if (code === undefined) {
      throw new FplIdentityError(
        'TEAM_ID_UNKNOWN',
        `Unknown team id ${teamId} in season ${this.season}`,
        { season: this.season, teamId },
      );
    }
    return code;
  }

  teamId(teamCode: number): number {
    const entry = this.teamRegistry.byCode.get(teamCode);
    if (!entry) {
      throw new FplIdentityError(
        'TEAM_CODE_UNKNOWN',
        `Unknown team code ${teamCode} in season ${this.season}`,
        { season: this.season, teamCode },
      );
    }
    return entry.teamId;
  }

  teamEntry(teamCode: number): TeamSeasonEntry {
    const entry = this.teamRegistry.byCode.get(teamCode);
    if (!entry) {
      throw new FplIdentityError(
        'TEAM_CODE_UNKNOWN',
        `Unknown team code ${teamCode} in season ${this.season}`,
        { season: this.season, teamCode },
      );
    }
    return entry;
  }

  teamSlug(teamId: number): string {
    const code = this.teamCode(teamId);
    const slug = this.teamRegistry.byCode.get(code)?.slug;
    if (!slug) {
      throw new FplIdentityError(
        'TEAM_SLUG_UNKNOWN',
        `No slug for team id ${teamId} (code ${code}) in season ${this.season}`,
        { season: this.season, teamId, teamCode: code },
      );
    }
    return slug;
  }

  teamSlugFromCode(teamCode: number): string {
    const slug = this.teamEntry(teamCode).slug;
    if (!slug) {
      throw new FplIdentityError(
        'TEAM_SLUG_UNKNOWN',
        `No slug for team code ${teamCode} in season ${this.season}`,
        { season: this.season, teamCode },
      );
    }
    return slug;
  }

  slugToTeamCode(slug: string): number {
    const code = this.teamRegistry.slugToCode.get(slug);
    if (code === undefined) {
      throw new FplIdentityError(
        'SLUG_UNKNOWN',
        `Unknown team slug "${slug}" in season ${this.season}`,
        { season: this.season, slug },
      );
    }
    return code;
  }

  hasSlug(slug: string): boolean {
    return this.teamRegistry.slugToCode.has(slug);
  }

  resolveTeamSlug(value: string | number): string {
    if (typeof value === 'number' || /^\d+$/.test(String(value))) {
      return this.teamSlug(Number(value));
    }
    const slug = slugFromVaastav(String(value)) ?? slugFromFd(String(value));
    if (!slug) {
      throw new FplIdentityError(
        'TEAM_NAME_UNMAPPED',
        `Cannot map team name "${value}" to slug in season ${this.season}`,
        { season: this.season, teamName: String(value) },
      );
    }
    this.slugToTeamCode(slug);
    return slug;
  }

  elementToCodeMap(): ReadonlyMap<number, number> {
    return this.playerRegistry.elementToCode;
  }

  codeToElementMap(): ReadonlyMap<number, number> {
    const map = new Map<number, number>();
    for (const [code, entry] of this.playerRegistry.byCode) {
      map.set(code, entry.elementId);
    }
    return map;
  }

  teamIdToSlugMap(): ReadonlyMap<number, string> {
    const map = new Map<number, string>();
    for (const [teamId, teamCode] of this.teamRegistry.idToCode) {
      const slug = this.teamRegistry.byCode.get(teamCode)?.slug;
      if (slug) map.set(teamId, slug);
    }
    return map;
  }

  attachFplCodes<T extends { seasonElementId: number }>(rows: readonly T[]): (T & { fplCode: number })[] {
    const missing: number[] = [];
    const out: (T & { fplCode: number })[] = [];
    for (const row of rows) {
      const fplCode = this.playerRegistry.elementToCode.get(row.seasonElementId);
      if (fplCode === undefined) {
        missing.push(row.seasonElementId);
        continue;
      }
      out.push({ ...row, fplCode });
    }
    if (missing.length > 0) {
      throw new FplIdentityError(
        'PLAYER_ELEMENT_UNKNOWN',
        `${missing.length} row(s) missing element→code mapping in season ${this.season}`,
        { season: this.season, elementIds: missing.slice(0, 20), totalMissing: missing.length },
      );
    }
    return out;
  }
}
