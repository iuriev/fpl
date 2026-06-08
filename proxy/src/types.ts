export const MAX_GAMEWEEK = 38;

export interface Gameweek {
  id: number;
  name: string;
  finished: boolean;
  averageScore?: number;
  highestScore?: number;
}

export interface GameweeksResponse {
  current: number;
  next: number;
  gameweeks: Gameweek[];
}

export interface EntryResponse {
  teamId: number;
  teamName: string;
  managerName: string;
  overallPoints: number;
  overallRank: number;
  eventPoints: number;
  eventRank: number;
  totalPlayers: number;
  regionIsoCode?: string;
}

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export type PlayerStatus = 'a' | 'd' | 'i' | 's' | 'u' | 'n';

export interface PlayerStats {
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  total_points: number;
}

export interface SquadPlayer {
  id: number;
  fplCode: number;
  name: string;
  position: PlayerPosition;
  club: string;
  teamCode: number;
  teamId: number;
  nowCost: number;
  points: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  status: PlayerStatus;
  chanceOfPlaying?: number | null;
  news?: string;
  stats: PlayerStats;
  statBreakdown?: StatEntry[];
  isWatchlisted: boolean;
}

export interface SquadSummary {
  totalPoints: number;
  averagePoints?: number;
  highestPoints?: number;
  rank?: number;
  transfers: number;
  bank?: number;
  freeTransfers: number;
}

export interface HistoryGameweek {
  gw: number;
  overallRank: number;
  overallPoints: number;
  gwRank: number;
  gwPoints: number;
  pointsOnBench: number;
  transfers: number;
  transferCost: number;
  teamValue: number;
}

export interface HistoryResponse {
  teamId: number;
  gameweeks: HistoryGameweek[];
}

export interface LeagueEntry {
  id: number;
  name: string;
  rank: number;
  lastRank: number | null;
}

export interface LeaguesResponse {
  teamId: number;
  classic: LeagueEntry[];
  h2h: LeagueEntry[];
}

export type ActiveChip = 'wildcard' | '3xc' | 'freehit' | 'bboost' | null;

export type ChipStatus = 'available' | 'used' | 'active';

export interface ChipInfo {
  status: ChipStatus;
  usedInGw?: number;
}

export interface ChipStatuses {
  wildcard: ChipInfo;
  freehit: ChipInfo;
  bboost: ChipInfo;
  '3xc': ChipInfo;
}

export interface SquadResponse {
  gameweek: number;
  activeChip: ActiveChip;
  chipStatuses: ChipStatuses;
  summary: SquadSummary;
  starters: SquadPlayer[];
  bench: SquadPlayer[];
}

export interface StatEntry {
  identifier: string;
  value: number;
  points: number;
}

export interface TopPlayer {
  id: number;
  fplCode: number;
  webName: string;
  position: PlayerPosition;
  teamCode: number;
  teamShortName: string;
  points: number;
  selectedByPercent: string;
  statBreakdown?: StatEntry[];
}

export interface TopPlayersGameweekResponse {
  gw: number;
  players: TopPlayer[];
}

export interface TopPlayersSeasonResponse {
  players: TopPlayer[];
}

export interface TeamInfo {
  id: number;
  code: number;
  name: string;
  shortName: string;
}

export interface TeamsResponse {
  teams: TeamInfo[];
}

export interface TeamPlayersResponse {
  teamCode: number;
  teamName: string;
  teamShortName: string;
  players: TopPlayer[];
}

export interface TeamOfTheWeekPlayer {
  id: number;
  webName: string;
  position: PlayerPosition;
  teamCode: number;
  teamShortName: string;
  points: number;
  pitchPosition: number;
}

export interface TeamOfTheWeekResponse {
  gw: number;
  players: TeamOfTheWeekPlayer[];
}

export interface FixtureInfo {
  gw: number;
  opponent: string;
  home: boolean;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface PoolPlayer {
  id: number;
  code: number;
  webName: string;
  firstName: string;
  lastName: string;
  team: number;
  teamCode: number;
  teamShortName: string;
  position: PlayerPosition;
  nowCost: number;
  totalPoints: number;
  eventPoints: number;
  status: PlayerStatus;
  chanceOfPlaying: number | null;
  news: string;
  selectedByPercent: string;
  expectedPoints: string;
  form: string;
  nextFixtures: FixtureInfo[];
  isWatchlisted: boolean;
}

export interface PlayerPoolResponse {
  players: PoolPlayer[];
}

export interface Transfer {
  event: number;
  elementIn: number;
  elementInName: string;
  elementOut: number;
  elementOutName: string;
  elementInCost: number;
  elementOutCost: number;
  time: string;
}

export interface TransfersResponse {
  teamId: number;
  transfers: Transfer[];
}

export type PriceChangePeriod = 'gw' | 'season';
export type PriceChangeDirection = 'rise' | 'fall';
export type PricePredictionDirection = 'rise' | 'fall';
export type PredictionLikelihood = 'unlikely' | 'likely' | 'very_likely';

export interface PriceChangePlayer {
  id: number;
  webName: string;
  position: PlayerPosition;
  teamCode: number;
  teamShortName: string;
  nowCost: number;
  changeAmount: number;
  transfersInEvent: number;
  transfersOutEvent: number;
  selectedByPercent: string;
}

export interface PriceChangesResponse {
  period: PriceChangePeriod;
  direction: PriceChangeDirection;
  players: PriceChangePlayer[];
}

export interface PricePredictionPlayer {
  id: number;
  webName: string;
  position: PlayerPosition;
  teamCode: number;
  teamShortName: string;
  nowCost: number;
  transfersInEvent: number;
  transfersOutEvent: number;
  selectedByPercent: string;
  netTransfersEvent: number;
  transferInPercent: number | null;
  likelihood: PredictionLikelihood;
}

export interface PricePredictionsResponse {
  direction: PricePredictionDirection;
  players: PricePredictionPlayer[];
}

export interface PlayerProfileStat {
  identifier: string;
  value: number;
}

export interface PlayerProfileResponse {
  player: {
    id: number;
    fplCode: number;
    webName: string;
    position: PlayerPosition;
    teamCode: number;
    teamShortName: string;
    nowCost: number;
    selectedByPercent: string;
    status: PlayerStatus;
    news: string;
  };
  gw: number | null;
  gwPoints: number | null;
  gwStats: PlayerProfileStat[];
  nextFixtures: FixtureInfo[];
}

export interface StandingEntry {
  entry: number;
  entryName: string;
  playerName: string;
  rank: number;
  lastRank: number | null;
  total: number;
  eventTotal: number;
}

export interface LeagueStandingsResponse {
  leagueId: number;
  leagueName: string;
  page: number;
  hasNext: boolean;
  standings: StandingEntry[];
}

export interface LeaderboardPlayer {
  id: number;
  webName: string;
  position: PlayerPosition;
  teamCode: number;
  teamShortName: string;
  nowCost: number;
  value: number;
  avg?: number;
}

export interface LeaderboardGwResponse {
  gw: number;
  defcon: LeaderboardPlayer[];
  bps: LeaderboardPlayer[];
}

export interface LeaderboardSeasonResponse {
  defcon: LeaderboardPlayer[];
  bps: LeaderboardPlayer[];
}

export type PlayerLane = 'L' | 'C' | 'R';

export type FormationSource =
  | 'recent_fixtures'
  | 'previous_season'
  | 'default'
  | 'squad_fit'
  | 'lineup_fit'
  | 'derived';

export interface FormationCounts {
  def: number;
  mid: number;
  fwd: number;
}

export interface InferredFormation {
  counts: FormationCounts;
  label: string;
  source: FormationSource;
}

export interface PredictedLineupPlayer {
  id: number;
  fplCode: number;
  webName: string;
  position: PlayerPosition;
  teamCode: number;
  lane: PlayerLane;
  pitchOrder: number;
  xMins: number;
  xPts: number;
  benchRisk: boolean;
  injuryWarning: boolean;
  chanceOfPlaying: number | null;
  status: string;
}

export interface PredictedTeamLineup {
  teamId: number;
  teamCode: number;
  shortName: string;
  formation: InferredFormation;
  nextFixture: {
    opponentShortName: string;
    isHome: boolean;
    kickoffTime: string | null;
  } | null;
  players: PredictedLineupPlayer[];
}

export interface PredictedLineupsResponse {
  gameweek: number;
  teams: PredictedTeamLineup[];
}

export type PredictionConfidence = 'low' | 'medium' | 'high';

export interface PlayerGameweekPrediction {
  fplCode: number;
  playerId: number;
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
