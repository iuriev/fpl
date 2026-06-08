export type AuditSeverity = 'error' | 'warning';

export type AuditCategory = 'player' | 'team' | 'cross-source' | 'cross-season';

export interface AuditIssue {
  severity: AuditSeverity;
  category: AuditCategory;
  code: string;
  message: string;
  details?: Record<string, string | number | boolean | null>;
}

export interface VaastavPlayerRow {
  elementId: number;
  fplCode: number;
  webName: string;
  firstName: string;
  secondName: string;
  elementType: number;
  teamId: number;
  teamCode: number;
}

export interface VaastavTeamRow {
  teamId: number;
  teamCode: number;
  name: string;
  shortName: string;
}

export interface VaastavSeasonSnapshot {
  season: string;
  players: VaastavPlayerRow[];
  teams: VaastavTeamRow[];
  mergedGwElementIds: number[];
  mergedGwTeamIds: number[];
  mergedGwRowCount: number;
  mergedGwElementNames: Map<number, string>;
  mergedGwNamesByElement: Map<number, Set<string>>;
}

export interface PlayerSeasonEntry {
  elementId: number;
  webName: string;
  firstName: string;
  secondName: string;
  teamCode: number;
  elementType: number;
}

export interface TeamSeasonEntry {
  teamId: number;
  name: string;
  shortName: string;
  slug: string | null;
}

export interface PlayerRegistry {
  byCode: Map<number, PlayerSeasonEntry>;
  elementToCode: Map<number, number>;
}

export interface TeamRegistry {
  byCode: Map<number, TeamSeasonEntry>;
  idToCode: Map<number, number>;
  slugToCode: Map<string, number>;
}

export interface SeasonAuditResult {
  season: string;
  source: 'vaastav' | 'bootstrap';
  ok: boolean;
  errorCount: number;
  warningCount: number;
  issues: AuditIssue[];
  playerRegistry: PlayerRegistry;
  teamRegistry: TeamRegistry;
  stats: {
    playersRaw: number;
    teams: number;
    mergedGwRows: number;
    mergedGwElements: number;
    fdMatches: number;
    fdTeams: number;
  };
}

export interface CrossSeasonAuditResult {
  seasonA: string;
  seasonB: string;
  ok: boolean;
  errorCount: number;
  warningCount: number;
  issues: AuditIssue[];
  stats: {
    playerCodesA: number;
    playerCodesB: number;
    playerCodesBoth: number;
    teamCodesBoth: number;
    newPlayerCodesInB: number;
    departedPlayerCodes: number;
  };
}
