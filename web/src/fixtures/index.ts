import type { DreamTeamPlayer, DreamTeamResponse, EntryResponse, GameweeksResponse, PlayerStats, SquadResponse, TeamPlayersResponse, TeamsResponse, TopPlayersGwResponse, TopPlayersSeasonResponse } from '@/types';

function mkStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return {
    minutes: 90,
    goals_scored: 0,
    assists: 0,
    clean_sheets: 0,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 0,
    red_cards: 0,
    saves: 0,
    bonus: 0,
    total_points: 2,
    ...overrides,
  };
}

export const fixtureGameweeks: GameweeksResponse = {
  current: 37,
  gameweeks: Array.from({ length: 37 }, (_, i) => ({
    id: i + 1,
    name: `Gameweek ${i + 1}`,
    finished: i < 36,
  })),
};

export const fixtureEntry: EntryResponse = {
  teamId: 72828,
  teamName: 'Amorim_out',
  managerName: 'Ivan Iuriev',
  overallPoints: 2156,
  overallRank: 142857,
  eventPoints: 67,
  totalPlayers: 10500000,
  regionIsoCode: 'UA',
};

export const fixtureSquad: SquadResponse = {
  gameweek: 37,
  summary: {
    totalPoints: 67,
    averagePoints: 48,
    highestPoints: 112,
    rank: 1234567,
    transfers: 1,
  },
  starters: [
    { id: 1, name: 'Flekken', position: 'GK', club: 'BRE', teamCode: 94, teamId: 94, nowCost: 50, points: 6, isCaptain: false, isViceCaptain: false, status: 'a', stats: mkStats({ clean_sheets: 1, saves: 5, total_points: 6 }) },
    { id: 2, name: 'Alexander-Arnold', position: 'DEF', club: 'LIV', teamCode: 14, teamId: 14, nowCost: 85, points: 8, isCaptain: false, isViceCaptain: false, status: 'a', stats: mkStats({ assists: 1, clean_sheets: 1, bonus: 2, total_points: 8 }) },
    { id: 3, name: 'Pedro Porro', position: 'DEF', club: 'TOT', teamCode: 6, teamId: 6, nowCost: 55, points: 2, isCaptain: false, isViceCaptain: false, status: 'i', news: 'Hamstring injury. Doubt for next match.', stats: mkStats({ minutes: 45, goals_conceded: 2, total_points: 2 }) },
    { id: 4, name: 'Gabriel', position: 'DEF', club: 'ARS', teamCode: 3, teamId: 3, nowCost: 60, points: 6, isCaptain: false, isViceCaptain: false, status: 'a', stats: mkStats({ clean_sheets: 1, total_points: 6 }) },
    { id: 5, name: 'Mykolenko', position: 'DEF', club: 'EVE', teamCode: 11, teamId: 11, nowCost: 45, points: 2, isCaptain: false, isViceCaptain: false, status: 'd', chanceOfPlaying: 75, news: '75% chance to play.', stats: mkStats({ goals_conceded: 2, total_points: 2 }) },
    { id: 6, name: 'Salah', position: 'MID', club: 'LIV', teamCode: 14, teamId: 14, nowCost: 135, points: 14, isCaptain: true, isViceCaptain: false, status: 'a', stats: mkStats({ goals_scored: 1, assists: 1, bonus: 3, total_points: 14 }) },
    { id: 7, name: 'Saka', position: 'MID', club: 'ARS', teamCode: 3, teamId: 3, nowCost: 100, points: 8, isCaptain: false, isViceCaptain: true, status: 'a', stats: mkStats({ assists: 1, bonus: 2, total_points: 8 }) },
    { id: 8, name: 'Palmer', position: 'MID', club: 'CHE', teamCode: 8, teamId: 8, nowCost: 110, points: 7, isCaptain: false, isViceCaptain: false, status: 'a', stats: mkStats({ goals_scored: 1, bonus: 1, total_points: 7 }) },
    { id: 9, name: 'Andreas', position: 'MID', club: 'FUL', teamCode: 54, teamId: 54, nowCost: 55, points: 5, isCaptain: false, isViceCaptain: false, status: 'a', stats: mkStats({ clean_sheets: 1, bonus: 1, total_points: 5 }) },
    { id: 10, name: 'Isak', position: 'FWD', club: 'NEW', teamCode: 4, teamId: 4, nowCost: 90, points: 4, isCaptain: false, isViceCaptain: false, status: 'a', stats: mkStats({ bonus: 2, total_points: 4 }) },
    { id: 11, name: 'Mbeumo', position: 'FWD', club: 'BRE', teamCode: 94, teamId: 94, nowCost: 80, points: 5, isCaptain: false, isViceCaptain: false, status: 'a', stats: mkStats({ goals_scored: 1, total_points: 5 }) },
  ],
  bench: [
    { id: 12, name: 'Flaherty', position: 'GK', club: 'CRY', teamCode: 31, teamId: 31, nowCost: 45, points: 2, isCaptain: false, isViceCaptain: false, status: 'a', stats: mkStats({ goals_conceded: 1, saves: 3, total_points: 2 }) },
    { id: 13, name: 'Wan-Bissaka', position: 'DEF', club: 'WHU', teamCode: 21, teamId: 21, nowCost: 45, points: 1, isCaptain: false, isViceCaptain: false, status: 'a', stats: mkStats({ minutes: 30, total_points: 1 }) },
    { id: 14, name: 'Mbete', position: 'MID', club: 'NOT', teamCode: 17, teamId: 17, nowCost: 45, points: 0, isCaptain: false, isViceCaptain: false, status: 'a', stats: mkStats({ minutes: 0, total_points: 0 }) },
    { id: 15, name: 'Vardy', position: 'FWD', club: 'LEI', teamCode: 13, teamId: 13, nowCost: 55, points: 0, isCaptain: false, isViceCaptain: false, status: 's', news: 'Suspended for 1 match.', stats: mkStats({ minutes: 0, total_points: 0 }) },
  ],
};

export const fixtureSquadEmpty: SquadResponse = {
  gameweek: 1,
  summary: { totalPoints: 0, transfers: 0 },
  starters: [],
  bench: [],
};

function mkDtPlayer(overrides: Partial<DreamTeamPlayer> & Pick<DreamTeamPlayer, 'id' | 'webName' | 'position' | 'pitchPosition'>): DreamTeamPlayer {
  return {
    teamCode: 3,
    teamShortName: 'ARS',
    points: 10,
    ...overrides,
  };
}

const POSITIONS: TopPlayersPlayer['position'][] = ['GK', 'DEF', 'MID', 'FWD'];

function mkTopPlayer(i: number): TopPlayersPlayer {
  return {
    id: i + 1,
    webName: `Player${i + 1}`,
    position: POSITIONS[i % 4],
    teamCode: 3,
    teamShortName: 'ARS',
    points: 100 - i,
  };
}

export const fixtureTopPlayersGw: TopPlayersGwResponse = {
  gw: 36,
  players: [
    { id: 1, webName: 'Haaland', position: 'FWD', teamCode: 43, teamShortName: 'MCI', points: 20 },
    { id: 2, webName: 'Salah', position: 'MID', teamCode: 14, teamShortName: 'LIV', points: 18 },
    { id: 3, webName: 'Saka', position: 'MID', teamCode: 3, teamShortName: 'ARS', points: 15 },
    { id: 4, webName: 'Raya', position: 'GK', teamCode: 3, teamShortName: 'ARS', points: 12 },
    { id: 5, webName: 'Saliba', position: 'DEF', teamCode: 3, teamShortName: 'ARS', points: 11 },
    ...Array.from({ length: 95 }, (_, i) => mkTopPlayer(i + 5)),
  ],
};

export const fixtureTopPlayersSeason: TopPlayersSeasonResponse = {
  players: [
    { id: 1, webName: 'Salah', position: 'MID', teamCode: 14, teamShortName: 'LIV', points: 280 },
    { id: 2, webName: 'Haaland', position: 'FWD', teamCode: 43, teamShortName: 'MCI', points: 260 },
    { id: 3, webName: 'Saka', position: 'MID', teamCode: 3, teamShortName: 'ARS', points: 210 },
    ...Array.from({ length: 97 }, (_, i) => mkTopPlayer(i + 3)),
  ],
};

export const fixtureTeams: TeamsResponse = {
  teams: [
    { id: 1, code: 3, name: 'Arsenal', shortName: 'ARS' },
    { id: 8, code: 8, name: 'Chelsea', shortName: 'CHE' },
    { id: 11, code: 43, name: 'Man City', shortName: 'MCI' },
  ],
};

export const fixtureTeamPlayers: TeamPlayersResponse = {
  teamCode: 3,
  teamName: 'Arsenal',
  teamShortName: 'ARS',
  players: [
    { id: 1, webName: 'Saka', position: 'MID', teamCode: 3, teamShortName: 'ARS', points: 210 },
    { id: 2, webName: 'Saliba', position: 'DEF', teamCode: 3, teamShortName: 'ARS', points: 180 },
    { id: 3, webName: 'Raya', position: 'GK', teamCode: 3, teamShortName: 'ARS', points: 150 },
    { id: 4, webName: 'Havertz', position: 'MID', teamCode: 3, teamShortName: 'ARS', points: 120 },
  ],
};

export const fixtureDreamTeam: DreamTeamResponse = {
  gw: 36,
  players: [
    mkDtPlayer({ id: 101, webName: 'Raya', position: 'GK', pitchPosition: 1, points: 10 }),
    mkDtPlayer({ id: 102, webName: 'Saliba', position: 'DEF', pitchPosition: 2, points: 12 }),
    mkDtPlayer({ id: 103, webName: 'Gabriel', position: 'DEF', pitchPosition: 3, points: 11 }),
    mkDtPlayer({ id: 104, webName: 'White', position: 'DEF', pitchPosition: 4, points: 9 }),
    mkDtPlayer({ id: 105, webName: 'Saka', position: 'MID', pitchPosition: 5, points: 18 }),
    mkDtPlayer({ id: 106, webName: 'Ødegaard', position: 'MID', pitchPosition: 6, points: 15 }),
    mkDtPlayer({ id: 107, webName: 'Havertz', position: 'MID', pitchPosition: 7, points: 14, teamCode: 43, teamShortName: 'MCI' }),
    mkDtPlayer({ id: 108, webName: 'Rice', position: 'MID', pitchPosition: 8, points: 13 }),
    mkDtPlayer({ id: 109, webName: 'Haaland', position: 'FWD', pitchPosition: 9, points: 20, teamCode: 43, teamShortName: 'MCI' }),
    mkDtPlayer({ id: 110, webName: 'Jesus', position: 'FWD', pitchPosition: 10, points: 16 }),
    mkDtPlayer({ id: 111, webName: 'Trossard', position: 'FWD', pitchPosition: 11, points: 8 }),
  ],
};
