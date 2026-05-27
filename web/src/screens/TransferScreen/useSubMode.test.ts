import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { SquadPlayer, TransferDraft } from '@/types';

import { useSubMode } from './useSubMode';

const ZERO_STATS: SquadPlayer['stats'] = {
  minutes: 0, goals_scored: 0, assists: 0, clean_sheets: 0,
  goals_conceded: 0, own_goals: 0, penalties_saved: 0, penalties_missed: 0,
  yellow_cards: 0, red_cards: 0, saves: 0, bonus: 0, total_points: 0,
};

function makePlayer(id: number, position: SquadPlayer['position']): SquadPlayer {
  return {
    id, name: `Player${id}`, position, club: 'TST', teamCode: 1, teamId: 1,
    nowCost: 50, points: 0, isCaptain: false, isViceCaptain: false,
    status: 'a', chanceOfPlaying: null, news: '', stats: ZERO_STATS,
  };
}

// Formation 5-2-3: DEF×5, MID×2, FWD×3 — at MID minimum, so subbing MID out for non-MID is invalid
const STARTERS_5_2_3: SquadPlayer[] = [
  makePlayer(1, 'GK'),
  makePlayer(2, 'DEF'), makePlayer(3, 'DEF'), makePlayer(4, 'DEF'),
  makePlayer(5, 'DEF'), makePlayer(6, 'DEF'),
  makePlayer(7, 'MID'), makePlayer(8, 'MID'),
  makePlayer(9, 'FWD'), makePlayer(10, 'FWD'), makePlayer(11, 'FWD'),
];

const BENCH_MIXED: SquadPlayer[] = [
  makePlayer(12, 'GK'),
  makePlayer(13, 'DEF'),
  makePlayer(14, 'MID'),
  makePlayer(15, 'FWD'),
];

function makeDraft(overrides: Partial<TransferDraft> = {}): TransferDraft {
  return {
    teamId: 1, targetGw: 6, savedAt: '', freeTransfers: 1,
    chip: 'none', swaps: [], subs: [], ...overrides,
  };
}

describe('useSubMode', () => {
  it('selecting a field player populates validSubTargets with bench candidates only', () => {
    const updateDraft = vi.fn();
    const { result } = renderHook(() =>
      useSubMode(STARTERS_5_2_3, BENCH_MIXED, updateDraft),
    );

    act(() => result.current.handleSubIconClick(2));

    // DEF(2) selected — valid bench targets exclude GK(12) (GK rule), include DEF(13), MID(14)
    // FWD(15) is excluded because it would give 4 FWDs (max 3)
    expect(result.current.selectedSubId).toBe(2);
    expect(result.current.validSubTargets.has(12)).toBe(false);
    expect(result.current.validSubTargets.has(13)).toBe(true);
    expect(result.current.validSubTargets.has(14)).toBe(true);
    expect(result.current.validSubTargets.has(15)).toBe(false);
    // starters are not targets
    expect(result.current.validSubTargets.has(3)).toBe(false);
  });

  it('selecting a bench player populates validSubTargets with field candidates only', () => {
    const updateDraft = vi.fn();
    const { result } = renderHook(() =>
      useSubMode(STARTERS_5_2_3, BENCH_MIXED, updateDraft),
    );

    act(() => result.current.handleSubIconClick(14));

    // MID(14) bench selected — targets are starters; GK(1) excluded by GK rule
    expect(result.current.validSubTargets.has(1)).toBe(false);
    expect(result.current.validSubTargets.has(12)).toBe(false);
    expect(result.current.selectedSubId).toBe(14);
  });

  it('GK on the field only targets a GK on the bench', () => {
    const updateDraft = vi.fn();
    const { result } = renderHook(() =>
      useSubMode(STARTERS_5_2_3, BENCH_MIXED, updateDraft),
    );

    act(() => result.current.handleSubIconClick(1));

    expect(result.current.validSubTargets.has(12)).toBe(true);
    expect(result.current.validSubTargets.size).toBe(1);
  });

  it('GK on the bench only targets a GK on the field', () => {
    const updateDraft = vi.fn();
    const { result } = renderHook(() =>
      useSubMode(STARTERS_5_2_3, BENCH_MIXED, updateDraft),
    );

    act(() => result.current.handleSubIconClick(12));

    expect(result.current.validSubTargets.has(1)).toBe(true);
    expect(result.current.validSubTargets.size).toBe(1);
  });

  it('excludes a bench player whose swap would leave MID < 2', () => {
    const updateDraft = vi.fn();
    const { result } = renderHook(() =>
      useSubMode(STARTERS_5_2_3, BENCH_MIXED, updateDraft),
    );

    // Select MID(7): replacing it with DEF(13) gives MID=1 — invalid
    act(() => result.current.handleSubIconClick(7));

    expect(result.current.validSubTargets.has(13)).toBe(false);
    expect(result.current.validSubTargets.has(15)).toBe(false);
    // Replacing with MID(14) keeps MID=2 — valid
    expect(result.current.validSubTargets.has(14)).toBe(true);
  });

  it('excludes a bench player whose swap would leave DEF < 3', () => {
    const updateDraft = vi.fn();
    // Formation 3-4-3
    const starters_3_4_3 = [
      makePlayer(1, 'GK'),
      makePlayer(2, 'DEF'), makePlayer(3, 'DEF'), makePlayer(4, 'DEF'),
      makePlayer(5, 'MID'), makePlayer(6, 'MID'), makePlayer(7, 'MID'), makePlayer(8, 'MID'),
      makePlayer(9, 'FWD'), makePlayer(10, 'FWD'), makePlayer(11, 'FWD'),
    ];
    const { result } = renderHook(() =>
      useSubMode(starters_3_4_3, BENCH_MIXED, updateDraft),
    );

    // Select DEF(2): replacing with MID(14) gives DEF=2 — invalid
    act(() => result.current.handleSubIconClick(2));
    expect(result.current.validSubTargets.has(14)).toBe(false);

    // Replacing with DEF(13) keeps DEF=3 — valid
    expect(result.current.validSubTargets.has(13)).toBe(true);
  });

  it('excludes a bench player whose swap would exceed position maximums (e.g. DEF > 5)', () => {
    const updateDraft = vi.fn();
    // Formation 5-4-1
    const starters_5_4_1 = [
      makePlayer(1, 'GK'),
      makePlayer(2, 'DEF'), makePlayer(3, 'DEF'), makePlayer(4, 'DEF'), makePlayer(5, 'DEF'), makePlayer(6, 'DEF'),
      makePlayer(7, 'MID'), makePlayer(8, 'MID'), makePlayer(9, 'MID'), makePlayer(10, 'MID'),
      makePlayer(11, 'FWD'),
    ];
    const { result } = renderHook(() =>
      useSubMode(starters_5_4_1, BENCH_MIXED, updateDraft),
    );

    // Select FWD(11) on field. Bench has DEF(13). 
    // Replacing FWD(11) with DEF(13) gives 6 DEF — invalid
    act(() => result.current.handleSubIconClick(11));
    expect(result.current.validSubTargets.has(13)).toBe(false);

    // Replacing with MID(14) gives 5 DEF, 5 MID, 0 FWD — invalid (FWD < 1)
    expect(result.current.validSubTargets.has(14)).toBe(false);

    // Replacing with FWD(15) gives 5 DEF, 4 MID, 1 FWD — valid
    expect(result.current.validSubTargets.has(15)).toBe(true);
  });

  it('excludes a bench player whose swap would exceed MID > 5', () => {
    const updateDraft = vi.fn();
    // Formation 3-5-2
    const starters_3_5_2 = [
      makePlayer(1, 'GK'),
      makePlayer(2, 'DEF'), makePlayer(3, 'DEF'), makePlayer(4, 'DEF'),
      makePlayer(5, 'MID'), makePlayer(6, 'MID'), makePlayer(7, 'MID'), makePlayer(8, 'MID'), makePlayer(9, 'MID'),
      makePlayer(10, 'FWD'), makePlayer(11, 'FWD'),
    ];
    const { result } = renderHook(() =>
      useSubMode(starters_3_5_2, BENCH_MIXED, updateDraft),
    );

    // Select DEF(2) on field. Bench has MID(14).
    // Replacing DEF(2) with MID(14) gives 2 DEF, 6 MID — invalid
    act(() => result.current.handleSubIconClick(2));
    expect(result.current.validSubTargets.has(14)).toBe(false);
  });

  it('excludes starters from candidates when a starter is selected', () => {
    const updateDraft = vi.fn();
    const { result } = renderHook(() =>
      useSubMode(STARTERS_5_2_3, BENCH_MIXED, updateDraft),
    );

    act(() => result.current.handleSubIconClick(2)); // Select DEF(2) on field

    // All other starters should NOT be valid targets
    for (const starter of STARTERS_5_2_3) {
      expect(result.current.validSubTargets.has(starter.id)).toBe(false);
    }
  });

  it('excludes bench players from candidates when a bench player is selected', () => {
    const updateDraft = vi.fn();
    const { result } = renderHook(() =>
      useSubMode(STARTERS_5_2_3, BENCH_MIXED, updateDraft),
    );

    act(() => result.current.handleSubIconClick(13)); // Select DEF(13) on bench

    // All other bench players should NOT be valid targets
    for (const benchPlayer of BENCH_MIXED) {
      expect(result.current.validSubTargets.has(benchPlayer.id)).toBe(false);
    }
  });

  it('handleSubTargetClick appends a SubSwap to draft.subs', () => {
    let capturedUpdater: ((d: TransferDraft) => TransferDraft) | null = null;
    const updateDraft = vi.fn((updater: (d: TransferDraft) => TransferDraft) => {
      capturedUpdater = updater;
    });
    const { result } = renderHook(() =>
      useSubMode(STARTERS_5_2_3, BENCH_MIXED, updateDraft),
    );

    act(() => result.current.handleSubIconClick(2));
    act(() => result.current.handleSubTargetClick(13));

    expect(updateDraft).toHaveBeenCalledOnce();
    const nextDraft = capturedUpdater!(makeDraft());
    expect(nextDraft.subs).toEqual([{ fieldId: 2, benchId: 13 }]);
    expect(result.current.selectedSubId).toBeNull();
  });

  it('handleSubTargetClick removes the reverse pair (undo)', () => {
    let capturedUpdater: ((d: TransferDraft) => TransferDraft) | null = null;
    const updateDraft = vi.fn((updater: (d: TransferDraft) => TransferDraft) => {
      capturedUpdater = updater;
    });

    // After a previous swap, DEF(13) is now a starter and DEF(2) is on the bench
    const postSwapStarters = STARTERS_5_2_3.map((p) =>
      p.id === 2 ? makePlayer(13, 'DEF') : p,
    );
    const postSwapBench = BENCH_MIXED.map((p) =>
      p.id === 13 ? makePlayer(2, 'DEF') : p,
    );

    const { result } = renderHook(() =>
      useSubMode(postSwapStarters, postSwapBench, updateDraft),
    );

    // Undo: click ↕ on DEF(13) now on field, click DEF(2) now on bench
    act(() => result.current.handleSubIconClick(13));
    act(() => result.current.handleSubTargetClick(2));

    expect(updateDraft).toHaveBeenCalledOnce();
    const draftWithSub = makeDraft({ subs: [{ fieldId: 2, benchId: 13 }] });
    const nextDraft = capturedUpdater!(draftWithSub);
    expect(nextDraft.subs).toEqual([]);
  });

  it('re-selecting the same player cancels sub mode', () => {
    const updateDraft = vi.fn();
    const { result } = renderHook(() =>
      useSubMode(STARTERS_5_2_3, BENCH_MIXED, updateDraft),
    );

    act(() => result.current.handleSubIconClick(7));
    expect(result.current.selectedSubId).toBe(7);

    act(() => result.current.handleSubIconClick(7));
    expect(result.current.selectedSubId).toBeNull();
  });

  it('cancelSub resets selectedSubId to null', () => {
    const updateDraft = vi.fn();
    const { result } = renderHook(() =>
      useSubMode(STARTERS_5_2_3, BENCH_MIXED, updateDraft),
    );

    act(() => result.current.handleSubIconClick(7));
    act(() => result.current.cancelSub());
    expect(result.current.selectedSubId).toBeNull();
  });
});
