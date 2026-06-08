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
  isWatchlisted?: boolean;
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
  players: TopPlayersPlayer[];
}

export interface StatEntry {
  identifier: string;
  value: number;
  points: number;
}

export interface TopPlayersPlayer {
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

export interface TopPlayersGwResponse {
  gw: number;
  players: TopPlayersPlayer[];
}

export interface TopPlayersSeasonResponse {
  players: TopPlayersPlayer[];
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

export type SubscriptionTier = 'free' | 'premium';
export type PriceChangePeriod = 'gw' | 'season';
export type PriceChangeDirection = 'rise' | 'fall';
export type PricePredictionDirection = 'rise' | 'fall';
export type PredictionLikelihood = 'unlikely' | 'likely' | 'very_likely';
export type PositionFilter = 'all' | PlayerPosition;

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

export interface PlayerProfileLineupAlerts {
  injuryWarning?: boolean;
  benchRisk?: boolean;
  chanceOfPlaying?: number | null;
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

export type TransferChip = 'none' | 'wildcard' | 'freehit';

export interface TransferSwap {
  outId: number;
  inId: number;
}

export interface SubSwap {
  fieldId: number;
  benchId: number;
}

export interface TransferDraft {
  teamId: number;
  targetGw: number;
  savedAt: string;
  freeTransfers: number;
  chip: TransferChip;
  swaps: TransferSwap[];
  subs: SubSwap[];
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

export interface CalendarTeam {
  id: number;
  code: number;
  name: string;
  shortName: string;
  strengthOverallHome: number;
  strengthOverallAway: number;
  strengthAttackHome: number;
  strengthAttackAway: number;
  strengthDefenceHome: number;
  strengthDefenceAway: number;
}

export interface CalendarGameweek {
  id: number;
  name: string;
  finished: boolean;
  isCurrent: boolean;
  deadline: string;
}

export type CalendarDifficulty = 1 | 2 | 3 | 4 | 5;

export interface CalendarFixture {
  opponentShortName: string;
  opponentId: number;
  home: boolean;
  officialDifficulty: CalendarDifficulty;
  overallDifficulty: CalendarDifficulty;
  defensiveDifficulty: CalendarDifficulty;
  attackingDifficulty: CalendarDifficulty;
  kickoffTime: string | null;
  restDaysBefore: number | null;
}

export interface TeamGwRow {
  gw: number;
  fixtures: CalendarFixture[];
}

export interface CalendarResponse {
  teams: CalendarTeam[];
  gameweeks: CalendarGameweek[];
  byTeam: Record<number, TeamGwRow[]>;
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
  status: PlayerStatus;
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

export type LineupsWarmupPhase =
  | 'idle'
  | 'waiting'
  | 'fixtures'
  | 'hot'
  | 'cold'
  | 'lineups'
  | 'done'
  | 'error';

export interface LineupsWarmupStatus {
  phase: LineupsWarmupPhase;
  ready: boolean;
  hotDone: number;
  hotTotal: number;
  coldDone: number;
  coldTotal: number;
  lastError: string | null;
  startedAt: string | null;
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

export type StartupSeedPhase = 'pending' | 'running' | 'done' | 'skipped';

export type PredictionsWarmupPhase = 'idle' | 'ingest' | 'score' | 'done' | 'error';

export interface PredictionsWarmupStatus {
  phase: PredictionsWarmupPhase;
  ready: boolean;
  targetEvent: number | null;
  lastError: string | null;
  startedAt: string | null;
}

export interface HealthResponse {
  status: 'ok';
  ready: boolean;
  seed: { phase: StartupSeedPhase };
  lineupsWarmup: LineupsWarmupStatus;
  predictionsWarmup: PredictionsWarmupStatus;
}
