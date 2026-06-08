export interface EplMatchRow {
  season: string;
  matchDate: string;
  homeSlug: string;
  awaySlug: string;
  fthg: number;
  ftag: number;
  ftr: string;
  referee?: string;
  homeShots?: number;
  awayShots?: number;
  oddsHome?: number;
  oddsDraw?: number;
  oddsAway?: number;
  oddsOver25?: number;
  oddsUnder25?: number;
}

export interface PlayerGwFactRow {
  season: string;
  round: number;
  element: number;
  fixture: number;
  teamId?: number;
  teamName?: string;
  position: string;
  minutes: number;
  starts: number;
  goals: number;
  assists: number;
  totalPoints: number;
  xp: number;
  expectedGoals: number;
  expectedAssists: number;
  defensiveContribution?: number;
  opponentTeam: number;
  wasHome: boolean;
}

export interface TeamPoissonFit {
  mu: number;
  homeAdv: number;
  attack: Map<string, number>;
  defence: Map<string, number>;
  teams: string[];
}

export type PredictionConfidence = 'low' | 'medium' | 'high';

export interface PlayerGameweekPrediction {
  fplCode: number;
  seasonElementId: number;
  event: number;
  xPts: number;
  xGoals: number;
  xAssists: number;
  csProb: number | null;
  defconPts: number;
  confidence: PredictionConfidence;
  epNextAnchor: number;
  modelXPts: number;
}

export interface PredictionsResponse {
  event: number;
  modelRunId: string | null;
  ready: boolean;
  players: PlayerGameweekPrediction[];
}

export type PredictionsPreviewByPosition = Record<
  'FWD' | 'MID' | 'DEF' | 'GK',
  PlayerGameweekPrediction[]
>;

export type AssistsPreviewByPosition = Record<'FWD' | 'MID' | 'DEF', PlayerGameweekPrediction[]>;

export interface PredictionsPreviewResponse {
  event: number;
  modelRunId: string | null;
  ready: boolean;
  byXPts: PredictionsPreviewByPosition;
  byXAssists: AssistsPreviewByPosition;
}

export interface TeamFixtureSummary {
  opponentTeamId: number;
  opponentShortName: string;
  isHome: boolean;
}

export interface TeamMarketDto {
  teamId: number;
  teamCode: number;
  teamName: string;
  teamShortName: string;
  fixtures: TeamFixtureSummary[];
  csProb: number;
  xG: number;
  xGA: number;
}

export interface MarketResponse {
  event: number;
  modelRunId: string | null;
  ready: boolean;
  teams: TeamMarketDto[];
}

export interface MarketPreviewResponse {
  event: number;
  modelRunId: string | null;
  ready: boolean;
  topCs: TeamMarketDto[];
  topXg: TeamMarketDto[];
}
