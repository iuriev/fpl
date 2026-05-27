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
    average_entry_score: number;
    highest_score: number;
  }>;
  teams: Array<{
    id: number;
    name: string;
    short_name: string;
    code: number;
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
  player_region_iso_code_short: string | null;
  leagues: {
    classic: FPLLeagueEntry[];
    h2h: FPLLeagueEntry[];
  };
}

export interface FPLPicks {
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
    };
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

async function fetchFPL<T>(path: string): Promise<T> {
  const url = `${FPL_BASE_URL}${path}`;
  const response = await fetch(url);
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

export async function getDreamTeam(gameweek: number): Promise<FPLDreamTeam> {
  return fetchFPL(`/dream-team/${gameweek}/`);
}

export async function getFixtures(gameweek: number): Promise<FPLFixture[]> {
  return fetchFPL(`/fixtures/?event=${gameweek}`);
}
