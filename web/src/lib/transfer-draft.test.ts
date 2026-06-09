import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { PoolPlayer, SquadPlayer, TransferDraft } from '@/types';

import {
  applySwapsToSquad,
  buildFreeHitSubs,
  buildFreeHitSwaps,
  calcBank,
  calcTransferCost,
  poolPlayerToSquadPlayer,
  readLocalDraft,
  removeLocalDraft,
  wouldExceedClubLimit,
} from './transfer-draft';

const makeDraft = (overrides?: Partial<TransferDraft>): TransferDraft => ({
  teamId: 123,
  targetGw: 5,
  savedAt: '2026-05-25T10:00:00.000Z',
  freeTransfers: 1,
  chip: 'none',
  swaps: [],
  subs: [],
  ...overrides,
});

const makePlayer = (
  id: number,
  teamId: number,
  nowCost: number,
  position: SquadPlayer['position'] = 'MID',
  sellPrice?: number
): SquadPlayer =>
  ({ id, teamId, nowCost, position, sellPrice }) as unknown as SquadPlayer;

const makePoolPlayer = (id: number, team: number, nowCost: number): PoolPlayer => ({
  id,
  code: id * 1000,
  webName: `P${id}`,
  firstName: 'A',
  lastName: 'B',
  team,
  teamCode: team * 10,
  teamShortName: `T${team}`,
  position: 'MID',
  nowCost,
  totalPoints: 50,
  eventPoints: 5,
  status: 'a',
  chanceOfPlaying: null,
  news: '',
  selectedByPercent: '10.0',
  expectedPoints: '5.0',
  form: '5.0',
  nextFixtures: [],
});

describe('transfer-draft', () => {
  beforeEach(() => localStorage.removeItem('fpl-transfer-draft-123'));
  afterEach(() => localStorage.removeItem('fpl-transfer-draft-123'));

  describe('readLocalDraft / removeLocalDraft', () => {
    it('reads a draft from localStorage', () => {
      const draft = makeDraft();
      localStorage.setItem('fpl-transfer-draft-123', JSON.stringify(draft));
      expect(readLocalDraft(123)).toEqual(draft);
    });

    it('returns null when no draft exists', () => {
      expect(readLocalDraft(123)).toBeNull();
    });

    it('removes the draft key', () => {
      localStorage.setItem('fpl-transfer-draft-123', JSON.stringify(makeDraft()));
      removeLocalDraft(123);
      expect(localStorage.getItem('fpl-transfer-draft-123')).toBeNull();
    });
  });

  describe('calcBank', () => {
    it('returns initial bank when no swaps', () => {
      expect(calcBank(100, [], [])).toBe(100);
    });

    it('increases bank when selling more expensive player', () => {
      const squadPlayers = [makePlayer(1, 1, 120)];
      const poolPlayers = [makePoolPlayer(2, 2, 80)];
      const swaps = [{ outId: 1, inId: 2 }];
      expect(calcBank(50, swaps, [...squadPlayers, ...poolPlayers])).toBe(90);
    });

    it('uses sell price when selling a player', () => {
      const squadPlayers = [makePlayer(1, 1, 120, 'MID', 100)];
      const poolPlayers = [makePoolPlayer(2, 2, 80)];
      const swaps = [{ outId: 1, inId: 2 }];
      expect(calcBank(50, swaps, [...squadPlayers, ...poolPlayers])).toBe(70);
    });
  });

  describe('buildFreeHitSwaps', () => {
    it('skips players kept in both squads', () => {
      const current = [
        makePlayer(10, 1, 130, 'FWD'),
        makePlayer(20, 2, 90, 'MID'),
      ];
      const target = [10, 99];
      const positions = new Map<number, SquadPlayer['position']>([
        [10, 'FWD'],
        [99, 'MID'],
        [20, 'MID'],
      ]);
      const swaps = buildFreeHitSwaps(current, target, positions);
      expect(swaps).toEqual([{ outId: 20, inId: 99 }]);
      expect(swaps.some((s) => s.inId === 10 || s.outId === 10)).toBe(false);
    });

    it('pairs incoming and outgoing players by position', () => {
      const current = [
        makePlayer(1, 1, 50, 'GK'),
        makePlayer(2, 1, 70, 'DEF'),
      ];
      const target = [9, 8];
      const positions = new Map<number, SquadPlayer['position']>([
        [1, 'GK'],
        [2, 'DEF'],
        [9, 'GK'],
        [8, 'DEF'],
      ]);
      expect(buildFreeHitSwaps(current, target, positions)).toEqual([
        { outId: 1, inId: 9 },
        { outId: 2, inId: 8 },
      ]);
    });
  });

  describe('buildFreeHitSubs', () => {
    const makeFullPlayer = (
      id: number,
      position: SquadPlayer['position'],
      name = `P${id}`
    ): SquadPlayer =>
      ({
        id,
        name,
        position,
        club: 'TST',
        teamCode: 1,
        teamId: 1,
        nowCost: 50,
        points: 0,
        isCaptain: false,
        isViceCaptain: false,
        status: 'a',
        stats: {
          minutes: 0,
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
          total_points: 0,
        },
      }) as SquadPlayer;

    it('promotes a high-xi midfielder from the bench over a weak forward', () => {
      const starters = [
        makeFullPlayer(1, 'GK'),
        makeFullPlayer(2, 'DEF'),
        makeFullPlayer(3, 'DEF'),
        makeFullPlayer(4, 'DEF'),
        makeFullPlayer(5, 'MID'),
        makeFullPlayer(6, 'MID'),
        makeFullPlayer(7, 'MID'),
        makeFullPlayer(8, 'MID'),
        makeFullPlayer(9, 'FWD'),
        makeFullPlayer(10, 'FWD', 'Thiago'),
        makeFullPlayer(11, 'FWD', 'Haaland'),
      ];
      const bench = [
        makeFullPlayer(12, 'GK'),
        makeFullPlayer(20, 'MID', 'Anderson'),
        makeFullPlayer(13, 'DEF'),
        makeFullPlayer(14, 'MID'),
      ];
      const squad = [...starters, ...bench];
      const target = [
        1, 2, 3, 4, 5, 6, 7, 8, 20, 9, 11,
        12, 10, 13, 14,
      ];
      const subs = buildFreeHitSubs(squad, target, 11);
      expect(subs).toContainEqual({ fieldId: 10, benchId: 20 });
    });

    it('leaves lineup unchanged when swaps already match target starters', () => {
      const squad = Array.from({ length: 15 }, (_, i) =>
        makeFullPlayer(i + 1, i < 11 ? 'MID' : 'DEF')
      );
      squad[0] = makeFullPlayer(1, 'GK');
      const target = squad.map((p) => p.id);
      expect(buildFreeHitSubs(squad, target, 11)).toEqual([]);
    });
  });

  describe('applySwapsToSquad', () => {
    it('replaces outgoing players in place', () => {
      const squad = [makePlayer(1, 1, 50, 'GK') as SquadPlayer];
      const pool = [makePoolPlayer(2, 1, 45)];
      pool[0].position = 'GK';
      const next = applySwapsToSquad(squad, [{ outId: 1, inId: 2 }], pool);
      expect(next[0].id).toBe(2);
    });
  });

  describe('calcTransferCost', () => {
    it('returns 0 when within free allowance', () => {
      expect(calcTransferCost(1, 1, 'none')).toBe(0);
    });

    it('charges 4pts per extra transfer', () => {
      expect(calcTransferCost(3, 1, 'none')).toBe(8);
    });

    it('returns 0 when chip is active', () => {
      expect(calcTransferCost(5, 1, 'wildcard')).toBe(0);
    });
  });

  describe('wouldExceedClubLimit', () => {
    it('returns false when club has fewer than 3 players', () => {
      const squad = [makePlayer(1, 5, 80), makePlayer(2, 5, 75)];
      const newPlayer = makePoolPlayer(99, 5, 70);
      expect(wouldExceedClubLimit(squad, newPlayer, 0)).toBe(false);
    });

    it('returns true when adding would make 4 from same club', () => {
      const squad = [makePlayer(1, 5, 80), makePlayer(2, 5, 75), makePlayer(3, 5, 70)];
      const newPlayer = makePoolPlayer(99, 5, 65);
      expect(wouldExceedClubLimit(squad, newPlayer, 0)).toBe(true);
    });

    it('does not count the outgoing player towards the club limit', () => {
      const squad = [makePlayer(1, 5, 80), makePlayer(2, 5, 75), makePlayer(3, 5, 70)];
      const newPlayer = makePoolPlayer(99, 5, 65);
      expect(wouldExceedClubLimit(squad, newPlayer, 3)).toBe(false);
    });
  });

  describe('poolPlayerToSquadPlayer', () => {
    it('converts a PoolPlayer to a minimal SquadPlayer', () => {
      const p = makePoolPlayer(10, 1, 90);
      const result = poolPlayerToSquadPlayer(p);
      expect(result.id).toBe(10);
      expect(result.teamCode).toBe(10);
      expect(result.teamId).toBe(1);
      expect(result.nowCost).toBe(90);
      expect(result.points).toBe(0);
      expect(result.isCaptain).toBe(false);
      expect(result.isViceCaptain).toBe(false);
    });
  });
});
