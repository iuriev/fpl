import { afterEach,beforeEach, describe, expect, it } from 'vitest';

import type { PoolPlayer, SquadPlayer,TransferDraft } from '@/types';

import {
  calcBank,
  calcTransferCost,
  clearDraft,
  loadDraft,
  poolPlayerToSquadPlayer,
  saveDraft,
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

const makePlayer = (id: number, teamId: number, nowCost: number): SquadPlayer =>
  ({ id, teamId, nowCost } as unknown as SquadPlayer);

const makePoolPlayer = (id: number, team: number, nowCost: number): PoolPlayer => ({
  id, webName: `P${id}`, firstName: 'A', lastName: 'B',
  team, teamCode: team * 10, teamShortName: `T${team}`,
  position: 'MID', nowCost, totalPoints: 50, eventPoints: 5,
  status: 'a', chanceOfPlaying: null, news: '',
  selectedByPercent: '10.0', form: '5.0', nextFixtures: [],
});

describe('transfer-draft', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  describe('saveDraft / loadDraft', () => {
    it('persists and retrieves a draft', () => {
      const draft = makeDraft();
      saveDraft(draft);
      expect(loadDraft(123, 5)).toEqual(draft);
    });

    it('returns null when no draft exists', () => {
      expect(loadDraft(123, 5)).toBeNull();
    });

    it('returns null and clears when targetGw does not match', () => {
      saveDraft(makeDraft({ targetGw: 4 }));
      expect(loadDraft(123, 5)).toBeNull();
      expect(localStorage.getItem('fpl-transfer-draft-123')).toBeNull();
    });
  });

  describe('clearDraft', () => {
    it('removes the draft from localStorage', () => {
      saveDraft(makeDraft());
      clearDraft(123);
      expect(loadDraft(123, 5)).toBeNull();
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
