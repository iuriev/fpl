/**
 * FPL API client — wraps HTTP calls to fantasy.premierleague.com/api
 * Isolated module for all FPL endpoint calls.
 */

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

export interface FPLBootstrapStatic {
  events: Array<{
    id: number;
    name: string;
    deadline_time: string;
    is_current: boolean;
    finished: boolean;
    average_entry_score: number;
    highest_score: number;
  }>;
  teams: Array<{
    id: number;
    name: string;
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
  }>;
  element_types: Array<{
    id: number;
    singular_name_short: string;
  }>;
}

export interface FPLEntry {
  id: number;
  name: string;
  player_first_name: string;
  player_last_name: string;
  summary_overall_rank: number;
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
  };
  picks: Array<{
    element: number;
    position: number;
    is_captain: boolean;
    is_vice_captain: boolean;
  }>;
}

export interface FPLLive {
  elements: Array<{
    id: number;
    stats: {
      total_points: number;
    };
  }>;
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
