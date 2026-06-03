/**
 * FPL API client — wraps HTTP calls to fantasy.premierleague.com/api
 * Isolated module for all FPL endpoint calls.
 */

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

export interface FPLBootstrapStatic {
  total_players: number;
  events: Array<{
    id: number;
    name: string;
    deadline_time: string;
    is_current: boolean;
    is_next: boolean;
    finished: boolean;
    data_checked: boolean;
    average_entry_score: number;
    highest_score: number;
  }>;
  teams: Array<{
    id: number;
    name: string;
    short_name: string;
    code: number;
  }>;
  chips: Array<{
    chip_type: string;
    name: string;
    start_event: number;
    stop_event: number;
  }>;
  elements: Array<{
    id: number;
    web_name: string;
    team: number;
    team_code: number;
    element_type: number;
    status: string;
    chance_of_playing_this_round: number | null;
    news: string;
    total_points: number;
    first_name: string;
    second_name: string;
    now_cost: number;
    event_points: number;
    form: string;
    selected_by_percent: string;
    ep_next: string;
    cost_change_event: number;
    cost_change_start: number;
    transfers_in_event: number;
    transfers_out_event: number;
    price_change_percent: string;
  }>;
  element_types: Array<{
    id: number;
    singular_name_short: string;
  }>;
}

export interface FPLLeagueEntry {
  id: number;
  name: string;
  entry_rank: number;
  entry_last_rank: number | null;
}

export interface FPLEntry {
  id: number;
  name: string;
  player_first_name: string;
  player_last_name: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  summary_event_rank: number;
  player_region_iso_code_short: string | null;
  leagues: {
    classic: FPLLeagueEntry[];
    h2h: FPLLeagueEntry[];
  };
}

export interface FPLPicks {
  active_chip: string | null;
  entry_history: {
    event: number;
    points: number;
    total_points: number;
    rank: number;
    event_transfers: number;
    event_transfers_cost: number;
    points_on_bench: number;
    bank: number;
    value: number;
  };
  picks: Array<{
    element: number;
    position: number;
    is_captain: boolean;
    is_vice_captain: boolean;
  }>;
}

export interface FPLTransfer {
  element_in: number;
  element_out: number;
  element_in_cost: number;
  element_out_cost: number;
  entry: number;
  event: number;
  time: string;
}

export interface FPLLeagueStandings {
  standings: {
    results: Array<{
      entry: number;
      entry_name: string;
      player_name: string;
      rank: number;
      last_rank: number | null;
      total: number;
      event_total: number;
    }>;
    has_next: boolean;
  };
  league: {
    id: number;
    name: string;
  };
}

export interface FPLHistoryChip {
  name: string;
  event: number;
  time: string;
}

export interface FPLHistory {
  current: Array<{
    event: number;
    points: number;
    total_points: number;
    rank: number;
    overall_rank: number;
    value: number;
    event_transfers: number;
    event_transfers_cost: number;
    points_on_bench: number;
  }>;
  chips: FPLHistoryChip[];
}

export interface FPLDreamTeamEntry {
  element: number;
  points: number;
  position: number;
}

export interface FPLDreamTeam {
  team: FPLDreamTeamEntry[];
  top_player: {
    id: number;
    points: number;
  };
}

export interface FPLLive {
  elements: Array<{
    id: number;
    stats: {
      total_points: number;
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
      bps: number;
    };
    explain: Array<{
      fixture: number;
      stats: Array<{
        identifier: string;
        points: number;
        value: number;
      }>;
    }>;
  }>;
}

export interface FPLFixture {
  id: number;
  event: number;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  kickoff_time: string | null;
  finished: boolean;
}

let lastRequestTime = 0;
const MAX_REQ_PER_SECOND = 10;
const MIN_INTERVAL = 1000 / MAX_REQ_PER_SECOND;

export function resetRateLimiter(): void {
  lastRequestTime = 0;
}

async function fetchFPL<T>(path: string): Promise<T> {
  const now = Date.now();
  const waitTime = Math.max(0, lastRequestTime + MIN_INTERVAL - now);
  lastRequestTime = Math.max(now, lastRequestTime + MIN_INTERVAL);

  if (waitTime > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  const url = `${FPL_BASE_URL}${path}`;
  const t0 = Date.now();
  const response = await fetch(url);
  const ms = Date.now() - t0;
  console.log(`[fpl] ${new Date().toISOString()} ${response.status} ${ms}ms ${path}`);
  if (!response.ok) {
    throw new Error(`FPL API error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function getBootstrapStatic(): Promise<FPLBootstrapStatic> {
  return fetchFPL('/bootstrap-static/');
}

export async function getEntry(teamId: number): Promise<FPLEntry> {
  return fetchFPL(`/entry/${teamId}/`);
}

export async function getPicks(teamId: number, gameweek: number): Promise<FPLPicks> {
  return fetchFPL(`/entry/${teamId}/event/${gameweek}/picks/`);
}

export async function getLive(gameweek: number): Promise<FPLLive> {
  return fetchFPL(`/event/${gameweek}/live/`);
}

export async function getHistory(teamId: number): Promise<FPLHistory> {
  return fetchFPL(`/entry/${teamId}/history/`);
}

export async function getTransfers(teamId: number): Promise<FPLTransfer[]> {
  return fetchFPL(`/entry/${teamId}/transfers/`);
}

export async function getLeagueStandings(
  leagueId: number,
  page: number
): Promise<FPLLeagueStandings> {
  return fetchFPL(`/leagues-classic/${leagueId}/standings/?page_standings=${page}`);
}

export async function getDreamTeam(gameweek: number): Promise<FPLDreamTeam> {
  return fetchFPL(`/dream-team/${gameweek}/`);
}

export async function getFixtures(gameweek: number): Promise<FPLFixture[]> {
  return fetchFPL(`/fixtures/?event=${gameweek}`);
}

export interface FPLElementSummary {
  history: Array<{
    round: number;
    total_points: number;
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
    bps: number;
    defensive_contribution: number;
  }>;
}

export async function getElementSummary(elementId: number): Promise<FPLElementSummary> {
  return fetchFPL(`/element-summary/${elementId}/`);
}
