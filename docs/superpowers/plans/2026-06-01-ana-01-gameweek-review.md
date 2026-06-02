# ANA-01: Gameweek Review Screen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a post-gameweek "Report Card" screen showing GW points, player performance, bench waste, transfer ROI, and a what-if verdict for the most recently completed gameweek.

**Architecture:** Five purely-presentational sub-components (`ReviewHero`, `ReviewPlayerList`, `ReviewBench`, `ReviewTransfers`, `ReviewWhatIf`) receive pre-computed props from the `GameweekReviewScreen` orchestrator, which fetches from four existing API hooks. Pure helper functions in `review-helpers.ts` handle squad diffing and score calculation; these are unit-tested in isolation.

**Tech Stack:** React 18, TypeScript, CSS Modules (`--fpl-*` design tokens), React Query (TanStack), React Router v6, Vitest/Testing Library.

---

## File Map

| Action | Path |
|--------|------|
| Modify | `proxy/src/types.ts` |
| Modify | `proxy/src/gameweeks-service.ts` |
| Modify | `proxy/src/gameweeks-service.test.ts` |
| Modify | `web/src/types/index.ts` |
| Create | `web/src/screens/GameweekReviewScreen/review-helpers.ts` |
| Create | `web/src/screens/GameweekReviewScreen/review-helpers.test.ts` |
| Modify | `web/src/lib/copy.ts` |
| Create | `web/src/screens/GameweekReviewScreen/ReviewHero.tsx` |
| Create | `web/src/screens/GameweekReviewScreen/ReviewHero.module.css` |
| Create | `web/src/screens/GameweekReviewScreen/ReviewPlayerList.tsx` |
| Create | `web/src/screens/GameweekReviewScreen/ReviewPlayerList.module.css` |
| Create | `web/src/screens/GameweekReviewScreen/ReviewBench.tsx` |
| Create | `web/src/screens/GameweekReviewScreen/ReviewBench.module.css` |
| Create | `web/src/screens/GameweekReviewScreen/ReviewTransfers.tsx` |
| Create | `web/src/screens/GameweekReviewScreen/ReviewTransfers.module.css` |
| Create | `web/src/screens/GameweekReviewScreen/ReviewWhatIf.tsx` |
| Create | `web/src/screens/GameweekReviewScreen/ReviewWhatIf.module.css` |
| Create | `web/src/screens/GameweekReviewScreen/GameweekReviewScreen.tsx` |
| Create | `web/src/screens/GameweekReviewScreen/GameweekReviewScreen.module.css` |
| Modify | `web/src/screens/index.ts` |
| Modify | `web/src/App.tsx` |
| Modify | `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx` |

---

## Task 1: Proxy — expose averageScore / highestScore in gameweeks response

**Files:**
- Modify: `proxy/src/types.ts`
- Modify: `proxy/src/gameweeks-service.ts`
- Modify: `proxy/src/gameweeks-service.test.ts`

- [ ] **Step 1.1: Add fields to proxy Gameweek type**

In `proxy/src/types.ts`, change:
```typescript
export interface Gameweek {
  id: number;
  name: string;
  finished: boolean;
}
```
to:
```typescript
export interface Gameweek {
  id: number;
  name: string;
  finished: boolean;
  averageScore?: number;
  highestScore?: number;
}
```

- [ ] **Step 1.2: Map the new fields in the service**

In `proxy/src/gameweeks-service.ts`, change the `gameweeks` mapping from:
```typescript
const gameweeks = bootstrap.events.map((e) => ({
  id: e.id,
  name: e.name,
  finished: e.finished,
}));
```
to:
```typescript
const gameweeks = bootstrap.events.map((e) => ({
  id: e.id,
  name: e.name,
  finished: e.finished,
  averageScore: e.average_entry_score > 0 ? e.average_entry_score : undefined,
  highestScore: e.highest_score > 0 ? e.highest_score : undefined,
}));
```

- [ ] **Step 1.3: Update tests to assert new fields**

In `proxy/src/gameweeks-service.test.ts`, change the assertion in the "returns current gameweek when flagged" test from:
```typescript
expect(result.gameweeks[0]).toEqual({
  id: 1,
  name: 'Gameweek 1',
  finished: true,
});
```
to:
```typescript
expect(result.gameweeks[0]).toEqual({
  id: 1,
  name: 'Gameweek 1',
  finished: true,
  averageScore: 50,
  highestScore: 100,
});
```

Also update the second test ("falls back to latest finished gameweek") to verify:
```typescript
expect(result.gameweeks[0]).toMatchObject({
  id: 1,
  averageScore: 50,
  highestScore: 100,
});
```

And the third test ("defaults to 1") to verify:
```typescript
expect(result.gameweeks[0]).toMatchObject({
  id: 1,
  averageScore: undefined,
  highestScore: undefined,
});
```

- [ ] **Step 1.4: Run proxy tests**

```bash
cd proxy && npm test -- --run
```
Expected: all 13 test files pass, 0 failures.

- [ ] **Step 1.5: Commit**

```bash
git add proxy/src/types.ts proxy/src/gameweeks-service.ts proxy/src/gameweeks-service.test.ts
git commit -m "feat(proxy): expose averageScore and highestScore in gameweeks response"
```

---

## Task 2: Frontend — sync Gameweek type

**Files:**
- Modify: `web/src/types/index.ts`

- [ ] **Step 2.1: Add optional fields to frontend Gameweek type**

In `web/src/types/index.ts`, change:
```typescript
export interface Gameweek {
  id: number;
  name: string;
  finished: boolean;
}
```
to:
```typescript
export interface Gameweek {
  id: number;
  name: string;
  finished: boolean;
  averageScore?: number;
  highestScore?: number;
}
```

- [ ] **Step 2.2: Run frontend tests**

```bash
cd web && npm test -- --run
```
Expected: all tests pass (no type errors, no test breakage).

- [ ] **Step 2.3: Commit**

```bash
git add web/src/types/index.ts
git commit -m "feat(types): add averageScore and highestScore to Gameweek"
```

---

## Task 3: review-helpers — pure calculation functions + tests

**Files:**
- Create: `web/src/screens/GameweekReviewScreen/review-helpers.ts`
- Create: `web/src/screens/GameweekReviewScreen/review-helpers.test.ts`

- [ ] **Step 3.1: Write the failing tests first**

Create `web/src/screens/GameweekReviewScreen/review-helpers.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import type { PoolPlayer, SquadPlayer } from '@/types';

import {
  buildTransferPairs,
  computeWhatIfScore,
  diffSquads,
  findReviewGw,
  getPlayerPointsClass,
  getStatLabel,
} from './review-helpers';

function makePlayer(id: number, name: string, points: number): SquadPlayer {
  return {
    id,
    name,
    points,
    position: 'MID',
    club: 'ARS',
    teamCode: 3,
    teamId: 3,
    nowCost: 80,
    isCaptain: false,
    isViceCaptain: false,
    status: 'a',
    stats: {
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
      total_points: points,
    },
  };
}

function makePoolPlayer(id: number, eventPoints: number): PoolPlayer {
  return {
    id,
    eventPoints,
    webName: 'Player',
    firstName: 'A',
    lastName: 'B',
    team: 1,
    teamCode: 1,
    teamShortName: 'TST',
    position: 'MID',
    nowCost: 50,
    totalPoints: 0,
    status: 'a',
    chanceOfPlaying: null,
    news: '',
    selectedByPercent: '5.0',
    expectedPoints: '4.0',
    form: '5.0',
    nextFixtures: [],
  };
}

describe('findReviewGw', () => {
  it('returns the id of the last finished GW', () => {
    expect(
      findReviewGw([
        { id: 1, finished: true },
        { id: 2, finished: true },
        { id: 3, finished: false },
      ])
    ).toBe(2);
  });

  it('returns null when no GW is finished', () => {
    expect(findReviewGw([{ id: 1, finished: false }])).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(findReviewGw([])).toBeNull();
  });
});

describe('diffSquads', () => {
  it('identifies transferred-in and transferred-out players', () => {
    const current = [makePlayer(1, 'A', 5), makePlayer(2, 'B', 3), makePlayer(3, 'C', 8)];
    const previous = [makePlayer(1, 'A', 0), makePlayer(4, 'D', 0), makePlayer(3, 'C', 0)];
    const result = diffSquads(current, previous);
    expect(result.transferredInIds).toEqual([2]);
    expect(result.transferredOutIds).toEqual([4]);
  });

  it('returns empty arrays when squads are identical', () => {
    const players = [makePlayer(1, 'A', 5), makePlayer(2, 'B', 3)];
    const result = diffSquads(players, players);
    expect(result.transferredInIds).toHaveLength(0);
    expect(result.transferredOutIds).toHaveLength(0);
  });
});

describe('buildTransferPairs', () => {
  it('pairs in/out players with their GW points', () => {
    const current = [makePlayer(2, 'Mbappe', 8)];
    const previous = [makePlayer(4, 'Son', 0)];
    const pool = [makePoolPlayer(4, 6)];
    const pairs = buildTransferPairs(current, previous, pool, [2], [4]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].in).toEqual({ id: 2, name: 'Mbappe', gwPoints: 8 });
    expect(pairs[0].out).toEqual({ id: 4, name: 'Son', gwPoints: 6 });
  });

  it('defaults out-player gwPoints to 0 when not in pool', () => {
    const current = [makePlayer(2, 'Mbappe', 8)];
    const previous = [makePlayer(4, 'Son', 0)];
    const pairs = buildTransferPairs(current, previous, [], [2], [4]);
    expect(pairs[0].out.gwPoints).toBe(0);
  });
});

describe('computeWhatIfScore', () => {
  it('subtracts in-player points, adds out-player points, restores transfer cost', () => {
    // actual=68, in=[8,6]=14, out=[6,11]=17, cost=4 → 68-14+17+4=75
    const pairs = [
      { in: { id: 2, name: 'Mbappe', gwPoints: 8 }, out: { id: 4, name: 'Son', gwPoints: 6 } },
      {
        in: { id: 5, name: 'R.James', gwPoints: 6 },
        out: { id: 6, name: 'Trippier', gwPoints: 11 },
      },
    ];
    expect(computeWhatIfScore(68, pairs, 4)).toBe(75);
  });

  it('returns actual score unchanged when no transfers', () => {
    expect(computeWhatIfScore(68, [], 0)).toBe(68);
  });
});

describe('getPlayerPointsClass', () => {
  it.each([
    [8, 'great'],
    [12, 'great'],
    [3, 'good'],
    [7, 'good'],
    [1, 'neutral'],
    [2, 'neutral'],
    [0, 'bad'],
  ] as const)('pts=%i → %s', (pts, expected) => {
    expect(getPlayerPointsClass(pts)).toBe(expected);
  });
});

describe('getStatLabel', () => {
  const base = {
    goals_scored: 0,
    assists: 0,
    clean_sheets: 0,
    minutes: 90,
    bonus: 0,
    yellow_cards: 0,
    red_cards: 0,
  };

  it('returns "0 mins" for non-playing player', () => {
    expect(getStatLabel({ ...base, minutes: 0 })).toBe('0 mins');
  });

  it('returns "goal + assist + +3 bonus" for a goalscorer with bonus', () => {
    expect(getStatLabel({ ...base, goals_scored: 1, assists: 1, bonus: 3 })).toBe(
      'goal + assist + +3 bonus'
    );
  });

  it('returns minutes string when no notable stats', () => {
    expect(getStatLabel(base)).toBe('90 mins');
  });

  it('returns "clean sheet" for player with 60+ mins', () => {
    expect(getStatLabel({ ...base, clean_sheets: 1, minutes: 90 })).toBe('clean sheet');
  });

  it('omits clean sheet for fewer than 60 mins', () => {
    expect(getStatLabel({ ...base, clean_sheets: 1, minutes: 45 })).toBe('45 mins');
  });

  it('returns "2 goals" for a brace', () => {
    expect(getStatLabel({ ...base, goals_scored: 2 })).toBe('2 goals');
  });
});
```

- [ ] **Step 3.2: Run tests — verify they all fail**

```bash
cd web && npm test -- --run review-helpers
```
Expected: FAIL — "Cannot find module './review-helpers'"

- [ ] **Step 3.3: Implement review-helpers.ts**

Create `web/src/screens/GameweekReviewScreen/review-helpers.ts`:

```typescript
import type { PoolPlayer, SquadPlayer } from '@/types';

export interface TransferPair {
  out: { id: number; name: string; gwPoints: number };
  in: { id: number; name: string; gwPoints: number };
}

export function findReviewGw(
  gameweeks: Array<{ id: number; finished: boolean }>
): number | null {
  const finished = gameweeks.filter((gw) => gw.finished);
  return finished.length > 0 ? finished[finished.length - 1].id : null;
}

export function diffSquads(
  currentPlayers: SquadPlayer[],
  previousPlayers: SquadPlayer[]
): { transferredInIds: number[]; transferredOutIds: number[] } {
  const currentIds = new Set(currentPlayers.map((p) => p.id));
  const previousIds = new Set(previousPlayers.map((p) => p.id));
  return {
    transferredInIds: currentPlayers.filter((p) => !previousIds.has(p.id)).map((p) => p.id),
    transferredOutIds: previousPlayers.filter((p) => !currentIds.has(p.id)).map((p) => p.id),
  };
}

export function buildTransferPairs(
  currentPlayers: SquadPlayer[],
  previousPlayers: SquadPlayer[],
  playerPool: PoolPlayer[],
  transferredInIds: number[],
  transferredOutIds: number[]
): TransferPair[] {
  const poolMap = new Map(playerPool.map((p) => [p.id, p]));
  const currentMap = new Map(currentPlayers.map((p) => [p.id, p]));
  const previousMap = new Map(previousPlayers.map((p) => [p.id, p]));

  const count = Math.min(transferredInIds.length, transferredOutIds.length);
  return Array.from({ length: count }, (_, i) => {
    const inId = transferredInIds[i];
    const outId = transferredOutIds[i];
    const inPlayer = currentMap.get(inId)!;
    const outPrev = previousMap.get(outId)!;
    const outPool = poolMap.get(outId);
    return {
      in: { id: inId, name: inPlayer.name, gwPoints: inPlayer.points },
      out: { id: outId, name: outPrev.name, gwPoints: outPool?.eventPoints ?? 0 },
    };
  });
}

export function computeWhatIfScore(
  actualGwPoints: number,
  transferPairs: TransferPair[],
  transferCost: number
): number {
  const inTotal = transferPairs.reduce((sum, t) => sum + t.in.gwPoints, 0);
  const outTotal = transferPairs.reduce((sum, t) => sum + t.out.gwPoints, 0);
  return actualGwPoints - inTotal + outTotal + transferCost;
}

export type PlayerPointsClass = 'great' | 'good' | 'neutral' | 'bad';

export function getPlayerPointsClass(pts: number): PlayerPointsClass {
  if (pts >= 8) return 'great';
  if (pts >= 3) return 'good';
  if (pts >= 1) return 'neutral';
  return 'bad';
}

export function getStatLabel(stats: {
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  minutes: number;
  bonus: number;
  yellow_cards: number;
  red_cards: number;
}): string {
  if (stats.minutes === 0) return '0 mins';
  const parts: string[] = [];
  if (stats.goals_scored > 0)
    parts.push(stats.goals_scored > 1 ? `${stats.goals_scored} goals` : 'goal');
  if (stats.assists > 0)
    parts.push(stats.assists > 1 ? `${stats.assists} assists` : 'assist');
  if (stats.clean_sheets > 0 && stats.minutes >= 60) parts.push('clean sheet');
  if (stats.bonus > 0) parts.push(`+${stats.bonus} bonus`);
  if (stats.red_cards > 0) parts.push('red card');
  else if (stats.yellow_cards > 0) parts.push('yellow card');
  if (parts.length === 0) return `${stats.minutes} mins`;
  return parts.join(' + ');
}
```

- [ ] **Step 3.4: Run tests — verify they all pass**

```bash
cd web && npm test -- --run review-helpers
```
Expected: all 15 tests pass.

- [ ] **Step 3.5: Commit**

```bash
git add web/src/screens/GameweekReviewScreen/review-helpers.ts web/src/screens/GameweekReviewScreen/review-helpers.test.ts
git commit -m "feat(review): add review-helpers with squad diff and score calculation"
```

---

## Task 4: Copy strings for the review screen

**Files:**
- Modify: `web/src/lib/copy.ts`

- [ ] **Step 4.1: Add review copy to the copy object**

In `web/src/lib/copy.ts`, append inside the `copy` object (after the transfers section, before the closing `}`):

```typescript
  // Gameweek review screen
  reviewTitle: 'Gameweek Review',
  reviewBack: 'Squad',
  reviewNavLink: 'GW Review',
  reviewGwPts: 'GW points',
  reviewVsAvg: 'vs avg',
  reviewAvg: 'avg',
  reviewHighest: 'highest',
  reviewGwRank: 'GW rank',
  reviewPlayersSection: 'Players — sorted by points',
  reviewBenchSection: 'Bench',
  reviewBenchWasted: '{pts} points left on bench',
  reviewBenchNone: 'Nothing left on bench',
  reviewNoAutosubs: 'No automatic substitutions',
  reviewBenchDivider: 'Bench',
  reviewTransfersSection: 'Transfers this gameweek',
  reviewNoTransfers: 'Rolled transfer — squad unchanged',
  reviewTransferOut: 'OUT',
  reviewTransferIn: 'IN',
  reviewTransferHit: '−{cost} pts transfer hit',
  reviewWhatIfSection: 'What if you made no transfers?',
  reviewWhatIfActual: 'Your score',
  reviewWhatIfWithTransfers: 'with transfers',
  reviewWhatIfHypothetical: 'Without transfers',
  reviewWhatIfGain: 'Transfers gained you {n} points',
  reviewWhatIfLoss: 'Transfers cost you {n} points',
  reviewWhatIfBreakEven: 'Transfers broke even this week',
  reviewLoadError: "Couldn't load gameweek review",
  reviewRetry: 'Try again',
  reviewNoGw: 'No completed gameweeks yet',
```

- [ ] **Step 4.2: Run tests**

```bash
cd web && npm test -- --run
```
Expected: all tests pass.

- [ ] **Step 4.3: Commit**

```bash
git add web/src/lib/copy.ts
git commit -m "feat(review): add copy strings for GW review screen"
```

---

## Task 5: ReviewHero component

**Files:**
- Create: `web/src/screens/GameweekReviewScreen/ReviewHero.tsx`
- Create: `web/src/screens/GameweekReviewScreen/ReviewHero.module.css`

- [ ] **Step 5.1: Create ReviewHero.tsx**

```typescript
import React from 'react';

import { ChipBadge } from '@/components/ui/ChipBadge/ChipBadge';
import { copy, interpolate } from '@/lib/copy';
import type { ActiveChip } from '@/types';

import styles from './ReviewHero.module.css';

export interface ReviewHeroProps {
  gwNumber: number;
  gwPoints: number;
  overallRank: number;
  previousOverallRank: number | undefined;
  gwRank: number;
  averageScore: number | undefined;
  highestScore: number | undefined;
  activeChip: ActiveChip;
}

function formatRank(n: number): string {
  return n.toLocaleString('en-GB');
}

export const ReviewHero: React.FC<ReviewHeroProps> = ({
  gwNumber,
  gwPoints,
  overallRank,
  previousOverallRank,
  gwRank,
  averageScore,
  highestScore,
  activeChip,
}) => {
  const rankDelta =
    previousOverallRank !== undefined ? previousOverallRank - overallRank : null;
  const rankUp = rankDelta !== null && rankDelta > 0;
  const rankDown = rankDelta !== null && rankDelta < 0;

  return (
    <div className={styles.hero}>
      <div className={styles.top}>
        <div className={styles.ptsBlock}>
          <span className={styles.pts}>{gwPoints}</span>
          <span className={styles.ptsLabel}>{copy.reviewGwPts}</span>
        </div>
        <div className={styles.rankBlock}>
          {rankDelta !== null && (
            <span
              className={`${styles.rankChange} ${rankUp ? styles.rankUp : ''} ${rankDown ? styles.rankDown : ''}`}
            >
              {rankUp ? '↑' : rankDown ? '↓' : '—'}{' '}
              {rankDelta !== 0 ? formatRank(Math.abs(rankDelta)) : ''}
            </span>
          )}
          <span className={styles.rankSub}>
            Overall: {formatRank(overallRank)}
          </span>
        </div>
      </div>

      <div className={styles.chips}>
        {averageScore !== undefined && (
          <>
            <span className={`${styles.chip} ${gwPoints > averageScore ? styles.chipGood : styles.chipNeutral}`}>
              <span>{copy.reviewVsAvg}</span>
              <span className={styles.chipVal}>
                {gwPoints > averageScore ? '+' : ''}{gwPoints - averageScore}
              </span>
            </span>
            <span className={`${styles.chip} ${styles.chipNeutral}`}>
              <span>{copy.reviewAvg}</span>
              <span className={styles.chipVal}>{averageScore}</span>
            </span>
          </>
        )}
        {highestScore !== undefined && (
          <span className={`${styles.chip} ${styles.chipNeutral}`}>
            <span>{copy.reviewHighest}</span>
            <span className={styles.chipVal}>{highestScore}</span>
          </span>
        )}
        <span className={`${styles.chip} ${styles.chipNeutral}`}>
          <span>{copy.reviewGwRank}</span>
          <span className={styles.chipVal}>{formatRank(gwRank)}</span>
        </span>
        {activeChip && (
          <ChipBadge chip={activeChip} className={styles.chipBadge} />
        )}
      </div>
    </div>
  );
};

ReviewHero.displayName = 'ReviewHero';
```

- [ ] **Step 5.2: Create ReviewHero.module.css**

```css
.hero {
  background: linear-gradient(135deg, var(--fpl-bg) 0%, var(--fpl-bg-deep) 100%);
  padding: 1.25rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.top {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}

.ptsBlock {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.pts {
  font-size: 3rem;
  font-weight: 900;
  line-height: 1;
  color: var(--fpl-text);
  font-family: var(--fpl-font-display);
}

.ptsLabel {
  font-size: 0.75rem;
  color: var(--fpl-muted);
}

.rankBlock {
  margin-left: auto;
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding-bottom: 0.25rem;
}

.rankChange {
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1;
  color: var(--fpl-muted);
  font-family: var(--fpl-font-display);
}

.rankUp   { color: var(--fpl-accent); }
.rankDown { color: var(--fpl-error); }

.rankSub {
  font-size: 0.65rem;
  color: var(--fpl-muted);
}

.chips {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
  align-items: center;
}

.chip {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  border: 1px solid var(--fpl-bg-hair);
  border-radius: 20px;
  padding: 0.25rem 0.625rem;
  font-size: 0.7rem;
  color: var(--fpl-muted);
}

.chipGood {
  border-color: var(--fpl-accent);
  color: var(--fpl-accent);
}

.chipNeutral {
  border-color: var(--fpl-bg-hair);
  color: var(--fpl-muted);
}

.chipVal {
  color: var(--fpl-text);
  font-weight: 700;
}

.chipGood .chipVal {
  color: var(--fpl-accent);
}

.chipBadge {
  margin-left: 0.125rem;
}
```

- [ ] **Step 5.3: Run tests**

```bash
cd web && npm test -- --run
```
Expected: all tests pass.

- [ ] **Step 5.4: Commit**

```bash
git add web/src/screens/GameweekReviewScreen/ReviewHero.tsx web/src/screens/GameweekReviewScreen/ReviewHero.module.css
git commit -m "feat(review): add ReviewHero component"
```

---

## Task 6: ReviewPlayerList component

**Files:**
- Create: `web/src/screens/GameweekReviewScreen/ReviewPlayerList.tsx`
- Create: `web/src/screens/GameweekReviewScreen/ReviewPlayerList.module.css`

- [ ] **Step 6.1: Create ReviewPlayerList.tsx**

```typescript
import React, { useState } from 'react';

import { PositionBadge } from '@/components/ui/PositionBadge/PositionBadge';
import { copy } from '@/lib/copy';
import type { SquadPlayer } from '@/types';

import { getPlayerPointsClass, getStatLabel, type PlayerPointsClass } from './review-helpers';
import styles from './ReviewPlayerList.module.css';

export interface ReviewPlayerListProps {
  starters: SquadPlayer[];
  bench: SquadPlayer[];
}

const PT_CLASS: Record<PlayerPointsClass, string> = {
  great: styles.rowGreat,
  good: styles.rowGood,
  neutral: styles.rowNeutral,
  bad: styles.rowBad,
};

function sortByPoints(players: SquadPlayer[]): SquadPlayer[] {
  return [...players].sort((a, b) => b.points - a.points);
}

function PlayerRow({ player, dimmed }: { player: SquadPlayer; dimmed?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const ptsClass = getPlayerPointsClass(player.points);
  const label = getStatLabel(player.stats);

  return (
    <>
      <button
        className={`${styles.row} ${PT_CLASS[ptsClass]} ${dimmed ? styles.rowDimmed : ''}`}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className={styles.club}>{player.club}</span>
        <span className={styles.info}>
          <span className={styles.name}>{player.name}</span>
          <span className={styles.meta}>
            <PositionBadge position={player.position} />
            {player.isCaptain && <span className={styles.capBadge}>{copy.statusCaptain}</span>}
            {player.isViceCaptain && (
              <span className={`${styles.capBadge} ${styles.vcBadge}`}>{copy.statusViceCaptain}</span>
            )}
            <span className={styles.label}>{label}</span>
          </span>
        </span>
        <span className={`${styles.pts} ${ptsClass === 'great' ? styles.ptsGreat : ''} ${ptsClass === 'bad' ? styles.ptsBad : ''}`}>
          {player.points}
        </span>
      </button>
      {expanded && (
        <div className={styles.statsRow}>
          {player.stats.minutes > 0 && <span>{player.stats.minutes} mins</span>}
          {player.stats.goals_scored > 0 && <span>⚽ {player.stats.goals_scored}</span>}
          {player.stats.assists > 0 && <span>🅰️ {player.stats.assists}</span>}
          {player.stats.clean_sheets > 0 && player.stats.minutes >= 60 && <span>🧤 CS</span>}
          {player.stats.bonus > 0 && <span>⭐ +{player.stats.bonus}</span>}
          {player.stats.yellow_cards > 0 && <span>🟨 YC</span>}
          {player.stats.red_cards > 0 && <span>🟥 RC</span>}
          {player.stats.saves > 0 && <span>🧤 {player.stats.saves} saves</span>}
          {player.stats.own_goals > 0 && <span>OG {player.stats.own_goals}</span>}
          {player.stats.penalties_missed > 0 && <span>✗ pen</span>}
        </div>
      )}
    </>
  );
}

export const ReviewPlayerList: React.FC<ReviewPlayerListProps> = ({ starters, bench }) => {
  const sortedStarters = sortByPoints(starters);
  const sortedBench = sortByPoints(bench);

  return (
    <div className={styles.section}>
      <span className={styles.sectionLabel}>{copy.reviewPlayersSection}</span>
      <div className={styles.list}>
        {sortedStarters.map((p) => (
          <PlayerRow key={p.id} player={p} />
        ))}
        <div className={styles.divider}>{copy.reviewBenchDivider}</div>
        {sortedBench.map((p) => (
          <PlayerRow key={p.id} player={p} dimmed />
        ))}
      </div>
    </div>
  );
};

ReviewPlayerList.displayName = 'ReviewPlayerList';
```

- [ ] **Step 6.2: Create ReviewPlayerList.module.css**

```css
.section {
  background: var(--fpl-bg-card);
  padding: 1rem;
}

.sectionLabel {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fpl-muted-soft);
  margin-bottom: 0.5rem;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.4rem 0.5rem;
  border-radius: 0.5rem;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  border-left: 3px solid transparent;
  color: var(--fpl-text);
  font-family: var(--fpl-font-display);
  transition: background 120ms;
}

.row:hover { background: var(--fpl-bg-soft); }

.rowGreat {
  background: var(--fpl-accent-faint);
  border-left-color: var(--fpl-accent);
}
.rowGreat:hover { background: var(--fpl-accent-faint); }

.rowGood  { border-left-color: rgba(0, 200, 100, 0.35); }
.rowNeutral { border-left-color: transparent; }

.rowBad {
  background: var(--fpl-error-soft);
  border-left-color: var(--fpl-error);
}
.rowBad:hover { background: var(--fpl-error-soft); }

.rowDimmed { opacity: 0.55; }

.club {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--fpl-bg-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.55rem;
  font-weight: 700;
  color: var(--fpl-muted);
  flex-shrink: 0;
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.name {
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.capBadge {
  background: var(--fpl-warn);
  color: var(--fpl-warn-ink);
  font-size: 0.6rem;
  font-weight: 800;
  padding: 0.0625rem 0.3125rem;
  border-radius: 0.1875rem;
}

.vcBadge {
  background: var(--fpl-accent);
  color: var(--fpl-accent-ink);
}

.label {
  font-size: 0.65rem;
  color: var(--fpl-muted);
}

.pts {
  font-size: 1rem;
  font-weight: 800;
  min-width: 2rem;
  text-align: right;
  color: var(--fpl-text);
}

.ptsGreat { color: var(--fpl-accent); }
.ptsBad   { color: var(--fpl-error); }

.divider {
  font-size: 0.6rem;
  color: var(--fpl-muted-soft);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.375rem 0.5rem 0.125rem;
}

.statsRow {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.25rem 0.5rem 0.375rem 3rem;
  font-size: 0.7rem;
  color: var(--fpl-muted);
}
```

- [ ] **Step 6.3: Run tests**

```bash
cd web && npm test -- --run
```
Expected: all tests pass.

- [ ] **Step 6.4: Commit**

```bash
git add web/src/screens/GameweekReviewScreen/ReviewPlayerList.tsx web/src/screens/GameweekReviewScreen/ReviewPlayerList.module.css
git commit -m "feat(review): add ReviewPlayerList component"
```

---

## Task 7: ReviewBench component

**Files:**
- Create: `web/src/screens/GameweekReviewScreen/ReviewBench.tsx`
- Create: `web/src/screens/GameweekReviewScreen/ReviewBench.module.css`

- [ ] **Step 7.1: Create ReviewBench.tsx**

```typescript
import React from 'react';

import { copy, interpolate } from '@/lib/copy';
import type { SquadPlayer } from '@/types';

import styles from './ReviewBench.module.css';

export interface ReviewBenchProps {
  bench: SquadPlayer[];
  pointsOnBench: number;
}

export const ReviewBench: React.FC<ReviewBenchProps> = ({ bench, pointsOnBench }) => {
  const calloutMod =
    pointsOnBench >= 10 ? styles.calloutHigh
    : pointsOnBench >= 4 ? styles.calloutMid
    : styles.calloutLow;

  return (
    <div className={styles.section}>
      <span className={styles.sectionLabel}>{copy.reviewBenchSection}</span>

      <div className={`${styles.callout} ${calloutMod}`}>
        <span className={styles.calloutIcon} aria-hidden="true">
          {pointsOnBench >= 4 ? '😬' : '😌'}
        </span>
        <div className={styles.calloutText}>
          <span className={styles.calloutTitle}>
            {pointsOnBench > 0
              ? interpolate(copy.reviewBenchWasted, { pts: pointsOnBench })
              : copy.reviewBenchNone}
          </span>
          <span className={styles.calloutSub}>{copy.reviewNoAutosubs}</span>
        </div>
      </div>

      <div className={styles.players}>
        {bench.map((p) => (
          <div key={p.id} className={styles.playerChip}>
            <span className={styles.playerName}>{p.name}</span>
            <span
              className={`${styles.playerPts} ${p.points >= 4 ? styles.playerPtsWarm : ''}`}
            >
              {p.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

ReviewBench.displayName = 'ReviewBench';
```

- [ ] **Step 7.2: Create ReviewBench.module.css**

```css
.section {
  background: var(--fpl-bg-card);
  padding: 1rem;
}

.sectionLabel {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fpl-muted-soft);
  margin-bottom: 0.5rem;
}

.callout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  padding: 0.625rem 0.75rem;
  margin-bottom: 0.625rem;
  border: 1px solid transparent;
}

.calloutHigh {
  background: rgba(255, 77, 109, 0.08);
  border-color: rgba(255, 77, 109, 0.25);
}

.calloutMid {
  background: rgba(255, 192, 0, 0.08);
  border-color: rgba(255, 192, 0, 0.25);
}

.calloutLow {
  background: var(--fpl-bg-soft);
  border-color: var(--fpl-bg-hair);
}

.calloutIcon { font-size: 1.375rem; }

.calloutText {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.calloutTitle {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--fpl-warn);
}

.calloutLow .calloutTitle { color: var(--fpl-text-soft); }

.calloutSub {
  font-size: 0.7rem;
  color: var(--fpl-muted);
}

.players {
  display: flex;
  gap: 0.375rem;
}

.playerChip {
  flex: 1;
  background: var(--fpl-bg-soft);
  border-radius: 0.5rem;
  padding: 0.375rem 0.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.playerName {
  font-size: 0.65rem;
  color: var(--fpl-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playerPts {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--fpl-muted);
}

.playerPtsWarm { color: var(--fpl-warn); }
```

- [ ] **Step 7.3: Run tests**

```bash
cd web && npm test -- --run
```
Expected: all tests pass.

- [ ] **Step 7.4: Commit**

```bash
git add web/src/screens/GameweekReviewScreen/ReviewBench.tsx web/src/screens/GameweekReviewScreen/ReviewBench.module.css
git commit -m "feat(review): add ReviewBench component"
```

---

## Task 8: ReviewTransfers component

**Files:**
- Create: `web/src/screens/GameweekReviewScreen/ReviewTransfers.tsx`
- Create: `web/src/screens/GameweekReviewScreen/ReviewTransfers.module.css`

- [ ] **Step 8.1: Create ReviewTransfers.tsx**

```typescript
import React from 'react';

import { copy, interpolate } from '@/lib/copy';

import type { TransferPair } from './review-helpers';
import styles from './ReviewTransfers.module.css';

export interface ReviewTransfersProps {
  transferPairs: TransferPair[];
  transferCost: number;
  transfers: number;
}

export const ReviewTransfers: React.FC<ReviewTransfersProps> = ({
  transferPairs,
  transferCost,
  transfers,
}) => {
  return (
    <div className={styles.section}>
      <span className={styles.sectionLabel}>{copy.reviewTransfersSection}</span>

      {transfers === 0 ? (
        <p className={styles.noTransfers}>{copy.reviewNoTransfers}</p>
      ) : (
        <>
          {transferPairs.map((pair, i) => {
            const delta = pair.in.gwPoints - pair.out.gwPoints;
            return (
              <div key={i} className={styles.row}>
                <div className={`${styles.card} ${styles.cardOut}`}>
                  <span className={styles.cardDir}>{copy.reviewTransferOut}</span>
                  <span className={styles.cardName}>{pair.out.name}</span>
                  <span className={styles.cardPts}>{pair.out.gwPoints}</span>
                </div>
                <span className={styles.arrow} aria-hidden="true">→</span>
                <div className={`${styles.card} ${styles.cardIn}`}>
                  <span className={styles.cardDir}>{copy.reviewTransferIn}</span>
                  <span className={styles.cardName}>{pair.in.name}</span>
                  <span className={styles.cardPts}>{pair.in.gwPoints}</span>
                </div>
                <span
                  className={`${styles.delta} ${delta >= 0 ? styles.deltaPos : styles.deltaNeg}`}
                >
                  {delta >= 0 ? '+' : ''}{delta}
                </span>
              </div>
            );
          })}
          {transferCost > 0 && (
            <p className={styles.hitNote}>
              {interpolate(copy.reviewTransferHit, { cost: transferCost })}
            </p>
          )}
        </>
      )}
    </div>
  );
};

ReviewTransfers.displayName = 'ReviewTransfers';
```

- [ ] **Step 8.2: Create ReviewTransfers.module.css**

```css
.section {
  background: var(--fpl-bg-card);
  padding: 1rem;
}

.sectionLabel {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fpl-muted-soft);
  margin-bottom: 0.5rem;
}

.noTransfers {
  font-size: 0.8rem;
  color: var(--fpl-muted);
}

.row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.card {
  flex: 1;
  border-radius: 0.5rem;
  padding: 0.5rem 0.625rem;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.cardOut {
  background: var(--fpl-error-soft);
  border: 1px solid rgba(255, 77, 109, 0.3);
}

.cardIn {
  background: var(--fpl-accent-faint);
  border: 1px solid rgba(0, 255, 135, 0.25);
}

.cardDir {
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.cardOut .cardDir { color: var(--fpl-error); }
.cardIn  .cardDir { color: var(--fpl-accent); }

.cardName {
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--fpl-text);
}

.cardPts {
  font-size: 1rem;
  font-weight: 800;
}

.cardOut .cardPts { color: rgba(255, 77, 109, 0.8); }
.cardIn  .cardPts { color: var(--fpl-accent); }

.arrow {
  font-size: 1rem;
  color: var(--fpl-muted-soft);
  flex-shrink: 0;
}

.delta {
  min-width: 2.25rem;
  text-align: center;
  border-radius: 0.375rem;
  padding: 0.25rem 0.375rem;
  font-size: 0.8rem;
  font-weight: 800;
  flex-shrink: 0;
}

.deltaPos {
  background: var(--fpl-accent-faint);
  color: var(--fpl-accent);
  border: 1px solid rgba(0, 255, 135, 0.3);
}

.deltaNeg {
  background: var(--fpl-error-soft);
  color: var(--fpl-error);
  border: 1px solid rgba(255, 77, 109, 0.3);
}

.hitNote {
  font-size: 0.65rem;
  color: var(--fpl-error);
  text-align: right;
  margin-top: 0.125rem;
}
```

- [ ] **Step 8.3: Run tests**

```bash
cd web && npm test -- --run
```
Expected: all tests pass.

- [ ] **Step 8.4: Commit**

```bash
git add web/src/screens/GameweekReviewScreen/ReviewTransfers.tsx web/src/screens/GameweekReviewScreen/ReviewTransfers.module.css
git commit -m "feat(review): add ReviewTransfers component"
```

---

## Task 9: ReviewWhatIf component

**Files:**
- Create: `web/src/screens/GameweekReviewScreen/ReviewWhatIf.tsx`
- Create: `web/src/screens/GameweekReviewScreen/ReviewWhatIf.module.css`

- [ ] **Step 9.1: Create ReviewWhatIf.tsx**

```typescript
import React from 'react';

import { copy, interpolate } from '@/lib/copy';

import styles from './ReviewWhatIf.module.css';

export interface ReviewWhatIfProps {
  actualPoints: number;
  whatIfScore: number;
}

export const ReviewWhatIf: React.FC<ReviewWhatIfProps> = ({ actualPoints, whatIfScore }) => {
  const delta = actualPoints - whatIfScore;
  const gained = delta > 0;
  const breakEven = delta === 0;

  const verdict = breakEven
    ? copy.reviewWhatIfBreakEven
    : gained
      ? interpolate(copy.reviewWhatIfGain, { n: delta })
      : interpolate(copy.reviewWhatIfLoss, { n: Math.abs(delta) });

  return (
    <div className={styles.section}>
      <span className={styles.sectionLabel}>{copy.reviewWhatIfSection}</span>
      <div className={styles.card}>
        <div className={`${styles.row} ${styles.rowActual}`}>
          <div className={styles.rowLabel}>
            <strong>{copy.reviewWhatIfActual}</strong>
            <span>{copy.reviewWhatIfWithTransfers}</span>
          </div>
          <span className={styles.rowPts}>{actualPoints}</span>
        </div>
        <div className={`${styles.row} ${styles.rowHypothetical}`}>
          <div className={styles.rowLabel}>
            <strong>{copy.reviewWhatIfHypothetical}</strong>
          </div>
          <span className={`${styles.rowPts} ${styles.rowPtsMuted}`}>{whatIfScore}</span>
        </div>
        <div className={`${styles.verdict} ${gained ? styles.verdictGood : breakEven ? styles.verdictNeutral : styles.verdictBad}`}>
          <span className={styles.verdictIcon} aria-hidden="true">
            {gained ? '✅' : breakEven ? '🤝' : '😬'}
          </span>
          <span>{verdict}</span>
        </div>
      </div>
    </div>
  );
};

ReviewWhatIf.displayName = 'ReviewWhatIf';
```

- [ ] **Step 9.2: Create ReviewWhatIf.module.css**

```css
.section {
  background: var(--fpl-bg-card);
  padding: 1rem;
  border-radius: 0 0 0.75rem 0.75rem;
}

.sectionLabel {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fpl-muted-soft);
  margin-bottom: 0.5rem;
}

.card {
  border-radius: 0.625rem;
  overflow: hidden;
}

.row {
  display: flex;
  align-items: center;
  padding: 0.625rem 0.75rem;
  gap: 0.625rem;
  border-bottom: 1px solid var(--fpl-bg-hair);
}

.rowActual       { background: var(--fpl-accent-faint); }
.rowHypothetical { background: var(--fpl-bg-soft); }

.rowLabel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.rowLabel strong {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--fpl-text);
}

.rowLabel span {
  font-size: 0.7rem;
  color: var(--fpl-muted);
}

.rowPts {
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--fpl-accent);
  font-family: var(--fpl-font-display);
}

.rowPtsMuted { color: var(--fpl-muted); }

.verdict {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.verdictGood    { background: linear-gradient(90deg, var(--fpl-accent-faint), transparent); color: var(--fpl-accent); }
.verdictBad     { background: linear-gradient(90deg, var(--fpl-error-soft), transparent); color: var(--fpl-error); }
.verdictNeutral { background: var(--fpl-bg-soft); color: var(--fpl-muted); }

.verdictIcon { font-size: 1.125rem; }
```

- [ ] **Step 9.3: Run tests**

```bash
cd web && npm test -- --run
```
Expected: all tests pass.

- [ ] **Step 9.4: Commit**

```bash
git add web/src/screens/GameweekReviewScreen/ReviewWhatIf.tsx web/src/screens/GameweekReviewScreen/ReviewWhatIf.module.css
git commit -m "feat(review): add ReviewWhatIf component"
```

---

## Task 10: GameweekReviewScreen — orchestrator

**Files:**
- Create: `web/src/screens/GameweekReviewScreen/GameweekReviewScreen.tsx`
- Create: `web/src/screens/GameweekReviewScreen/GameweekReviewScreen.module.css`

- [ ] **Step 10.1: Create GameweekReviewScreen.tsx**

```typescript
import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useGameweeks, useHistory, usePlayerPool, useSquad } from '@/api/queries';
import { Button } from '@/components/ui/Button/Button';
import { copy } from '@/lib/copy';

import {
  buildTransferPairs,
  computeWhatIfScore,
  diffSquads,
  findReviewGw,
} from './review-helpers';
import { ReviewBench } from './ReviewBench';
import { ReviewHero } from './ReviewHero';
import { ReviewPlayerList } from './ReviewPlayerList';
import { ReviewTransfers } from './ReviewTransfers';
import { ReviewWhatIf } from './ReviewWhatIf';
import styles from './GameweekReviewScreen.module.css';

export interface GameweekReviewScreenProps {
  teamId: number;
}

export const GameweekReviewScreen: React.FC<GameweekReviewScreenProps> = ({ teamId }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { data: gameweeksData } = useGameweeks();
  const { data: historyData, isLoading: historyLoading, isError: historyError, refetch } = useHistory(teamId);
  const { data: poolData } = usePlayerPool();

  const reviewGw = useMemo(
    () => (gameweeksData ? findReviewGw(gameweeksData.gameweeks) : null),
    [gameweeksData]
  );

  const prevGw = reviewGw !== null && reviewGw > 1 ? reviewGw - 1 : null;

  const { data: currentSquad } = useSquad(teamId, reviewGw);
  const { data: previousSquad } = useSquad(teamId, prevGw);

  const historyGw = useMemo(
    () => historyData?.gameweeks.find((g) => g.gw === reviewGw) ?? null,
    [historyData, reviewGw]
  );

  const previousHistoryGw = useMemo(
    () => (prevGw ? historyData?.gameweeks.find((g) => g.gw === prevGw) ?? null : null),
    [historyData, prevGw]
  );

  const reviewGwData = useMemo(() => {
    if (!currentSquad || !historyGw || !poolData) return null;

    const allCurrent = [...currentSquad.starters, ...currentSquad.bench];
    const allPrevious = previousSquad
      ? [...previousSquad.starters, ...previousSquad.bench]
      : [];

    const { transferredInIds, transferredOutIds } =
      allPrevious.length > 0 ? diffSquads(allCurrent, allPrevious) : { transferredInIds: [], transferredOutIds: [] };

    const transferPairs = buildTransferPairs(
      allCurrent,
      allPrevious,
      poolData.players,
      transferredInIds,
      transferredOutIds
    );

    const whatIfScore =
      historyGw.transfers > 0
        ? computeWhatIfScore(historyGw.gwPoints, transferPairs, historyGw.transferCost)
        : historyGw.gwPoints;

    const reviewGwObj = gameweeksData?.gameweeks.find((g) => g.id === reviewGw);

    return {
      gwPoints: historyGw.gwPoints,
      overallRank: historyGw.overallRank,
      previousOverallRank: previousHistoryGw?.overallRank,
      gwRank: historyGw.gwRank,
      averageScore: reviewGwObj?.averageScore,
      highestScore: reviewGwObj?.highestScore,
      activeChip: currentSquad.activeChip,
      starters: currentSquad.starters,
      bench: currentSquad.bench,
      pointsOnBench: historyGw.pointsOnBench,
      transferPairs,
      transferCost: historyGw.transferCost,
      transfers: historyGw.transfers,
      whatIfScore,
    };
  }, [currentSquad, previousSquad, historyGw, previousHistoryGw, poolData, gameweeksData, reviewGw]);

  const handleBack = () => {
    navigate(`/?teamId=${teamId}${searchParams.get('gw') ? `&gw=${searchParams.get('gw')}` : ''}`);
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack} aria-label={copy.reviewBack}>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M10 4l-4 4 4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {copy.reviewBack}
        </button>
        <span className={styles.title}>{copy.reviewTitle}</span>
        {reviewGw && <span className={styles.gwBadge}>GW {reviewGw}</span>}
      </header>

      <div className={styles.body}>
        {historyLoading && <div className={styles.loading}>{copy.loadingPlaceholder}</div>}

        {historyError && (
          <div className={styles.stateCenter}>
            <p className={styles.stateText}>{copy.reviewLoadError}</p>
            <Button variant="secondary" onClick={() => refetch()}>{copy.reviewRetry}</Button>
          </div>
        )}

        {!historyLoading && !historyError && !reviewGw && (
          <div className={styles.stateCenter}>
            <p className={styles.stateText}>{copy.reviewNoGw}</p>
          </div>
        )}

        {reviewGwData && (
          <div className={styles.cards}>
            <ReviewHero
              gwNumber={reviewGw!}
              gwPoints={reviewGwData.gwPoints}
              overallRank={reviewGwData.overallRank}
              previousOverallRank={reviewGwData.previousOverallRank}
              gwRank={reviewGwData.gwRank}
              averageScore={reviewGwData.averageScore}
              highestScore={reviewGwData.highestScore}
              activeChip={reviewGwData.activeChip}
            />
            <ReviewPlayerList
              starters={reviewGwData.starters}
              bench={reviewGwData.bench}
            />
            <ReviewBench
              bench={reviewGwData.bench}
              pointsOnBench={reviewGwData.pointsOnBench}
            />
            {reviewGwData.transfers > 0 && (
              <ReviewTransfers
                transferPairs={reviewGwData.transferPairs}
                transferCost={reviewGwData.transferCost}
                transfers={reviewGwData.transfers}
              />
            )}
            {reviewGwData.transfers > 0 && (
              <ReviewWhatIf
                actualPoints={reviewGwData.gwPoints}
                whatIfScore={reviewGwData.whatIfScore}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

GameweekReviewScreen.displayName = 'GameweekReviewScreen';
```

- [ ] **Step 10.2: Create GameweekReviewScreen.module.css**

```css
.screen {
  min-height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: var(--fpl-bg-deep);
  color: var(--fpl-text);
}

.header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--fpl-space-md);
  padding: var(--fpl-space-md) var(--fpl-space-xl3);
  border-bottom: 1px solid var(--fpl-bg-hair);
}

.backBtn {
  display: flex;
  align-items: center;
  gap: var(--fpl-space-xs);
  background: none;
  border: none;
  color: var(--fpl-muted);
  font: var(--fpl-fw-medium) var(--fpl-fs-body) var(--fpl-font-display);
  cursor: pointer;
  padding: var(--fpl-space-xs) 0;
  transition: color 120ms;
  white-space: nowrap;
}

.backBtn:hover { color: var(--fpl-text); }

.backBtn svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.title {
  font-size: var(--fpl-fs-body);
  font-weight: var(--fpl-fw-bold);
  color: var(--fpl-text);
  flex: 1;
}

.gwBadge {
  background: var(--fpl-bg);
  color: var(--fpl-accent);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1875rem 0.5rem;
  border-radius: 20px;
  letter-spacing: 0.05em;
}

.body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.loading {
  padding: 2rem;
  text-align: center;
  color: var(--fpl-muted);
  font-size: var(--fpl-fs-body);
}

.stateCenter {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--fpl-space-md);
  flex: 1;
  padding: 2rem;
}

.stateText {
  color: var(--fpl-muted);
  font-size: var(--fpl-fs-body);
  text-align: center;
}
```

- [ ] **Step 10.3: Run tests**

```bash
cd web && npm test -- --run
```
Expected: all tests pass.

- [ ] **Step 10.4: Commit**

```bash
git add web/src/screens/GameweekReviewScreen/GameweekReviewScreen.tsx web/src/screens/GameweekReviewScreen/GameweekReviewScreen.module.css
git commit -m "feat(review): add GameweekReviewScreen orchestrator"
```

---

## Task 11: Wire into the app — route, screen export, nav link

**Files:**
- Modify: `web/src/screens/index.ts`
- Modify: `web/src/App.tsx`
- Modify: `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx`

- [ ] **Step 11.1: Export the screen**

In `web/src/screens/index.ts`, add:
```typescript
export type { GameweekReviewScreenProps } from './GameweekReviewScreen/GameweekReviewScreen';
export { GameweekReviewScreen } from './GameweekReviewScreen/GameweekReviewScreen';
```

- [ ] **Step 11.2: Add the /review route in App.tsx**

In `web/src/App.tsx`, add `GameweekReviewScreen` to the import:
```typescript
import {
  TeamOfTheWeekScreen,
  EntryScreen,
  GameweekHistoryScreen,
  GameweekReviewScreen,
  LeaguesStatsScreen,
  SquadScreen,
  TopPlayersScreen,
  TransferScreen,
} from '@/screens';
```

Then add the route inside `<Routes>` (after the `/transfers` route):
```tsx
<Route
  path="/review"
  element={
    teamId ? (
      <GameweekReviewScreen teamId={teamId} />
    ) : (
      <EntryScreen onSubmit={(id) => setSearchParams({ teamId: String(id) })} />
    )
  }
/>
```

- [ ] **Step 11.3: Add nav link in TeamInfoPanel**

In `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx`, add the link after the history link (line ~62):
```tsx
<Link to={`/review?teamId=${teamId}`} className={styles.navLink}>
  {copy.reviewNavLink}
</Link>
```

- [ ] **Step 11.4: Run all tests**

```bash
cd web && npm test -- --run && cd ../proxy && npm test -- --run
```
Expected: all 109+ tests pass across both packages.

- [ ] **Step 11.5: Commit**

```bash
git add web/src/screens/index.ts web/src/App.tsx web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx
git commit -m "feat(review): wire up /review route and nav link"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Hero Summary (GW pts, rank change, vs avg, GW rank, chip badge) → Task 5
- ✅ Player List (sorted by pts, color-coded, bench divider, expandable stats) → Task 6
- ✅ Bench Wasted (callout + individual chips) → Task 7
- ✅ Transfer ROI (out→in cards, delta badge, hit note) → Task 8
- ✅ What-If Verdict (comparison card, verdict strip) → Task 9
- ✅ `averageScore`/`highestScore` from proxy → Task 1
- ✅ Navigation entry point (TeamInfoPanel link) → Task 11
- ✅ Route `/review` → Task 11
- ✅ GW1 edge case (no previous squad → skip transfer sections) → handled in Task 10 (`prevGw = null`)
- ✅ No transfers → transfers/what-if sections hidden → Task 10 (`transfers > 0` guards)

**Placeholder scan:** No TBD/TODO in code steps. All CSS uses `--fpl-*` tokens only.

**Type consistency:**
- `TransferPair` defined in `review-helpers.ts`, imported by `ReviewTransfers` and `GameweekReviewScreen` — consistent.
- `PlayerPointsClass` defined in `review-helpers.ts`, used in `ReviewPlayerList` — consistent.
- `ReviewHero` props match data shape computed in orchestrator — consistent.
- `copy.reviewBenchWasted` uses `{pts}` placeholder, called with `{ pts: pointsOnBench }` — consistent.
- `copy.reviewTransferHit` uses `{cost}`, called with `{ cost: transferCost }` — consistent.
- `copy.reviewWhatIfGain/Loss` use `{n}`, called with `{ n: delta }` — consistent.
