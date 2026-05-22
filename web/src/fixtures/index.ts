import type { EntryResponse, GameweeksResponse, SquadResponse } from '@/types';

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
    { id: 1, name: 'Flekken', position: 'GK', club: 'BRE', teamCode: 94, points: 6, isCaptain: false, isViceCaptain: false, status: 'a' },
    { id: 2, name: 'Alexander-Arnold', position: 'DEF', club: 'LIV', teamCode: 14, points: 8, isCaptain: false, isViceCaptain: false, status: 'a' },
    { id: 3, name: 'Pedro Porro', position: 'DEF', club: 'TOT', teamCode: 6, points: 2, isCaptain: false, isViceCaptain: false, status: 'i', news: 'Hamstring injury. Doubt for next match.' },
    { id: 4, name: 'Gabriel', position: 'DEF', club: 'ARS', teamCode: 3, points: 6, isCaptain: false, isViceCaptain: false, status: 'a' },
    { id: 5, name: 'Mykolenko', position: 'DEF', club: 'EVE', teamCode: 11, points: 2, isCaptain: false, isViceCaptain: false, status: 'd', chanceOfPlaying: 75, news: '75% chance to play.' },
    { id: 6, name: 'Salah', position: 'MID', club: 'LIV', teamCode: 14, points: 14, isCaptain: true, isViceCaptain: false, status: 'a' },
    { id: 7, name: 'Saka', position: 'MID', club: 'ARS', teamCode: 3, points: 8, isCaptain: false, isViceCaptain: true, status: 'a' },
    { id: 8, name: 'Palmer', position: 'MID', club: 'CHE', teamCode: 8, points: 7, isCaptain: false, isViceCaptain: false, status: 'a' },
    { id: 9, name: 'Andreas', position: 'MID', club: 'FUL', teamCode: 54, points: 5, isCaptain: false, isViceCaptain: false, status: 'a' },
    { id: 10, name: 'Isak', position: 'FWD', club: 'NEW', teamCode: 4, points: 4, isCaptain: false, isViceCaptain: false, status: 'a' },
    { id: 11, name: 'Mbeumo', position: 'FWD', club: 'BRE', teamCode: 94, points: 5, isCaptain: false, isViceCaptain: false, status: 'a' },
  ],
  bench: [
    { id: 12, name: 'Flaherty', position: 'GK', club: 'CRY', teamCode: 31, points: 2, isCaptain: false, isViceCaptain: false, status: 'a' },
    { id: 13, name: 'Wan-Bissaka', position: 'DEF', club: 'WHU', teamCode: 21, points: 1, isCaptain: false, isViceCaptain: false, status: 'a' },
    { id: 14, name: 'Mbete', position: 'MID', club: 'NOT', teamCode: 17, points: 0, isCaptain: false, isViceCaptain: false, status: 'a' },
    { id: 15, name: 'Vardy', position: 'FWD', club: 'LEI', teamCode: 13, points: 0, isCaptain: false, isViceCaptain: false, status: 's', news: 'Suspended for 1 match.' },
  ],
};

export const fixtureSquadEmpty: SquadResponse = {
  gameweek: 1,
  summary: { totalPoints: 0, transfers: 0 },
  starters: [],
  bench: [],
};
