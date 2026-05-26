# Transfer Screen UI Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 4 UI changes: captain badge to right side, team abbreviation + FDR chip under PlayerCard, outfield position picker (any non-GK candidate), and filter bar with position tabs + Sort button.

**Architecture:** Changes layer up from leaf components (PlayerCard, SortPickerSheet) through mid-level components (PlayerPickerSheet, TransferPitch) to screens (TransferScreen, SquadScreen). Each task produces independently buildable and testable changes.

**Tech Stack:** React 18, TypeScript, CSS Modules, Vite, Vitest + Testing Library, react-query

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `web/src/lib/copy.ts` | Modify | Add `transfersSortButton` and `transfersPositionAll` string constants |
| `web/src/components/ui/PlayerCard/PlayerCard.module.css` | Modify | Swap `capBadge` left↔right, `availBadge` right↔left |
| `web/src/components/ui/PlayerCard/PlayerCard.tsx` | Modify | Add `nextFixture?: FixtureInfo` prop; render team abbrev + FdrChip row below name pill |
| `web/src/components/ui/PlayerCard/PlayerCard.test.tsx` | Create | Tests for fixture row render/no-render |
| `web/src/screens/TransferScreen/SortPickerSheet.tsx` | Create | Fixed overlay (z-index 350) listing 5 sort options; exports `SortKey` and `SORT_OPTIONS` |
| `web/src/screens/TransferScreen/SortPickerSheet.module.css` | Create | Styles for sort overlay (z-index 350/349) |
| `web/src/screens/TransferScreen/SortPickerSheet.test.tsx` | Create | Tests for sort option display, selection, close |
| `web/src/screens/TransferScreen/PlayerPickerSheet.tsx` | Modify | Add `isOutfield` prop; position tabs; Sort button; SortPickerSheet; remove sort pills |
| `web/src/screens/TransferScreen/PlayerPickerSheet.module.css` | Modify | Replace `.sortPills`/`.sortPill` with filterRow, posTabs, posTab, sortBtn styles |
| `web/src/screens/TransferScreen/PlayerPickerSheet.test.tsx` | Modify | Add `isOutfield` to defaultProps; tests for tabs, sort button, position filtering |
| `web/src/screens/TransferScreen/TransferPitch.tsx` | Modify | Add `poolLookup?: Map<number, PoolPlayer>` prop; forward `nextFixture` to PlayerCard |
| `web/src/screens/TransferScreen/TransferScreen.tsx` | Modify | Build `poolLookup`; widen outfield candidates; add `isOutfield` prop to sheet |
| `web/src/screens/SquadScreen/SquadScreen.tsx` | Modify | Extend `maxGw` to `currentGw + 1`; call `usePlayerPool`; pass `nextFixture` when on next GW |

---

## Task 1: Copy keys for new UI strings

**Files:**
- Modify: `web/src/lib/copy.ts`

- [ ] **Step 1: Add two copy keys to the transfer planner section**

  In `web/src/lib/copy.ts`, add after `transfersStaleToast` (line 153):

  ```ts
  transfersSortButton: 'Sort',
  transfersPositionAll: 'ALL',
  ```

  Full context after the edit — the end of the transfers section becomes:
  ```ts
  transfersStaleToast: 'Your saved plan was for GW{n} which has passed. Starting fresh.',
  transfersSortButton: 'Sort',
  transfersPositionAll: 'ALL',
  ```

- [ ] **Step 2: Verify TypeScript passes**

  ```bash
  cd web && npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add web/src/lib/copy.ts
  git commit -m "feat(copy): add transfersSortButton and transfersPositionAll keys"
  ```

---

## Task 2: Captain badge to right side (CSS only)

**Files:**
- Modify: `web/src/components/ui/PlayerCard/PlayerCard.module.css`

- [ ] **Step 1: Swap `left`/`right` on `.capBadge` and `.availBadge`**

  In `web/src/components/ui/PlayerCard/PlayerCard.module.css`:

  Change `.capBadge` (line 35): `left: 0.5rem;` → `right: 0.5rem;`

  Change `.availBadge` (line 62): `right: 0.5rem;` → `left: 0.5rem;`

  After the edit the two rules look like:
  ```css
  .capBadge {
    position: absolute;
    top: -0.1875rem;
    right: 0.5rem;
    z-index: 2;
    /* ... rest unchanged ... */
  }

  .availBadge {
    position: absolute;
    top: -0.1875rem;
    left: 0.5rem;
    z-index: 2;
    /* ... rest unchanged ... */
  }
  ```

- [ ] **Step 2: Run existing tests to confirm no regressions**

  ```bash
  cd web && npx vitest run --reporter=verbose 2>&1 | tail -20
  ```
  Expected: all tests pass.

- [ ] **Step 3: Commit**

  ```bash
  git add web/src/components/ui/PlayerCard/PlayerCard.module.css
  git commit -m "feat(PlayerCard): move captain badge to right, availability badge to left"
  ```

---

## Task 3: PlayerCard — team abbreviation + FDR chip row

**Files:**
- Modify: `web/src/components/ui/PlayerCard/PlayerCard.tsx`
- Modify: `web/src/components/ui/PlayerCard/PlayerCard.module.css`
- Create: `web/src/components/ui/PlayerCard/PlayerCard.test.tsx`

- [ ] **Step 1: Add `nextFixture` prop, import `FdrChip` and `FixtureInfo`, render fixture row**

  Replace the entire `web/src/components/ui/PlayerCard/PlayerCard.tsx` with:

  ```tsx
  import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

  import { copy } from '@/lib/copy';
  import type { FixtureInfo, PlayerStatus, SquadPlayer } from '@/types';

  import { FdrChip } from '../FdrChip/FdrChip';
  import { Jersey } from '../Jersey/Jersey';
  import styles from './PlayerCard.module.css';

  export interface PlayerCardProps {
    player: SquadPlayer;
    size?: 'large' | 'medium';
    hidePoints?: boolean;
    nextFixture?: FixtureInfo;
  }

  function availBadge(status: PlayerStatus): { char: string; variant: 'warn' | 'error' } | null {
    const map: Partial<Record<PlayerStatus, { char: string; variant: 'warn' | 'error' }>> = {
      d: { char: '!', variant: 'warn' },
      i: { char: '+', variant: 'error' },
      s: { char: '!', variant: 'error' },
      u: { char: '×', variant: 'error' },
      n: { char: '×', variant: 'error' },
    };
    return map[status] ?? null;
  }

  function statusLabel(status: PlayerStatus): string {
    const labels: Partial<Record<PlayerStatus, string>> = {
      d: copy.statusDoubtful,
      i: copy.statusInjured,
      s: copy.statusSuspended,
      u: copy.statusUnavailable,
      n: copy.statusUnavailable,
    };
    return labels[status] ?? '';
  }

  export const PlayerCard: React.FC<PlayerCardProps> = ({
    player,
    size = 'medium',
    hidePoints = false,
    nextFixture,
  }) => {
    const [showStatus, setShowStatus] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const popupId = useId();
    const badge = availBadge(player.status);
    const isFlagged = badge !== null;

    const toggle = useCallback(() => {
      if (isFlagged) setShowStatus((v) => !v);
    }, [isFlagged]);

    useEffect(() => {
      if (!showStatus) return;
      const onPointer = (e: PointerEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          setShowStatus(false);
        }
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowStatus(false);
      };
      document.addEventListener('pointerdown', onPointer);
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('pointerdown', onPointer);
        document.removeEventListener('keydown', onKey);
      };
    }, [showStatus]);

    return (
      <div
        ref={ref}
        className={`${styles.card} ${isFlagged ? styles.flagged : ''}`}
        onClick={toggle}
        role={isFlagged ? 'button' : undefined}
        tabIndex={isFlagged ? 0 : undefined}
        aria-expanded={isFlagged ? showStatus : undefined}
        aria-controls={isFlagged ? popupId : undefined}
        onKeyDown={
          isFlagged
            ? (e) => {
                if (e.key === 'Enter') { e.preventDefault(); toggle(); }
                if (e.key === ' ') { e.preventDefault(); }
              }
            : undefined
        }
        onKeyUp={
          isFlagged
            ? (e) => { if (e.key === ' ') toggle(); }
            : undefined
        }
      >
        <div className={styles.jerseyWrap}>
          {(player.isCaptain || player.isViceCaptain) && (
            <span
              className={`${styles.capBadge}${player.isViceCaptain ? ` ${styles.capBadge_vice}` : ''}`}
              aria-label={player.isCaptain ? 'Captain' : 'Vice captain'}
            >
              {player.isCaptain ? copy.statusCaptain : copy.statusViceCaptain}
            </span>
          )}
          {badge && (
            <span
              className={`${styles.availBadge} ${styles[`availBadge_${badge.variant}`]}`}
              aria-hidden="true"
            >
              {badge.char}
            </span>
          )}
          <Jersey size={size} teamCode={player.teamCode} position={player.position} alt={player.name} />
        </div>

        <div className={styles.pill}>
          <span className={styles.name}>{player.name}</span>
          {!hidePoints && <span className={styles.points}>{player.points}</span>}
        </div>

        {nextFixture && (
          <div className={styles.fixtureRow}>
            <span className={styles.teamAbbrev}>{player.club}</span>
            <FdrChip
              opponent={nextFixture.opponent}
              home={nextFixture.home}
              difficulty={nextFixture.difficulty}
            />
          </div>
        )}

        {showStatus && badge && (
          <div
            id={popupId}
            className={styles.statusPopup}
            onClick={(e) => e.stopPropagation()}
          >
            <span className={`${styles.statusLabel} ${styles[`statusLabel_${badge.variant}`]}`}>
              {statusLabel(player.status)}
            </span>
            {player.chanceOfPlaying != null && (
              <span className={styles.chance}>{player.chanceOfPlaying}% chance of playing</span>
            )}
            {player.news && <span className={styles.news}>{player.news}</span>}
          </div>
        )}
      </div>
    );
  };

  PlayerCard.displayName = 'PlayerCard';
  ```

- [ ] **Step 2: Add `.fixtureRow` and `.teamAbbrev` styles**

  Append to the end of `web/src/components/ui/PlayerCard/PlayerCard.module.css`:

  ```css
  .fixtureRow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    margin-top: 0.125rem;
  }

  .teamAbbrev {
    font-family: var(--fpl-font-display);
    font-size: var(--fpl-fs-cap);
    font-weight: var(--fpl-fw-semibold);
    color: var(--fpl-muted-soft);
    letter-spacing: var(--fpl-tr-head-s);
    line-height: 1;
  }
  ```

- [ ] **Step 3: Create test file**

  Create `web/src/components/ui/PlayerCard/PlayerCard.test.tsx`:

  ```tsx
  import { render, screen } from '@testing-library/react';
  import { describe, expect, it } from 'vitest';

  import type { FixtureInfo, SquadPlayer } from '@/types';

  import { PlayerCard } from './PlayerCard';

  const makePlayer = (overrides?: Partial<SquadPlayer>): SquadPlayer => ({
    id: 1,
    name: 'Saka',
    position: 'MID',
    club: 'ARS',
    teamCode: 3,
    teamId: 1,
    nowCost: 95,
    points: 10,
    isCaptain: false,
    isViceCaptain: false,
    status: 'a',
    chanceOfPlaying: null,
    news: '',
    stats: {
      minutes: 90, goals_scored: 0, assists: 1, clean_sheets: 0,
      goals_conceded: 0, own_goals: 0, penalties_saved: 0,
      penalties_missed: 0, yellow_cards: 0, red_cards: 0,
      saves: 0, bonus: 0, total_points: 6,
    },
    ...overrides,
  });

  const makeFixture = (overrides?: Partial<FixtureInfo>): FixtureInfo => ({
    gw: 38, opponent: 'LIV', home: true, difficulty: 4,
    ...overrides,
  });

  describe('PlayerCard', () => {
    it('renders team abbreviation and opponent when nextFixture is provided', () => {
      render(<PlayerCard player={makePlayer()} nextFixture={makeFixture()} />);
      expect(screen.getByText('ARS')).toBeInTheDocument();
      expect(screen.getByText(/LIV/)).toBeInTheDocument();
    });

    it('does not render fixture row when nextFixture is absent', () => {
      render(<PlayerCard player={makePlayer()} />);
      expect(screen.queryByText('ARS')).not.toBeInTheDocument();
    });

    it('renders a different club abbreviation when club differs', () => {
      render(
        <PlayerCard
          player={makePlayer({ club: 'MCI' })}
          nextFixture={makeFixture({ opponent: 'CHE' })}
        />,
      );
      expect(screen.getByText('MCI')).toBeInTheDocument();
      expect(screen.getByText(/CHE/)).toBeInTheDocument();
    });
  });
  ```

- [ ] **Step 4: Run tests**

  ```bash
  cd web && npx vitest run src/components/ui/PlayerCard --reporter=verbose
  ```
  Expected: 3 tests pass.

- [ ] **Step 5: Commit**

  ```bash
  git add web/src/components/ui/PlayerCard/PlayerCard.tsx \
          web/src/components/ui/PlayerCard/PlayerCard.module.css \
          web/src/components/ui/PlayerCard/PlayerCard.test.tsx
  git commit -m "feat(PlayerCard): add nextFixture prop; render team abbrev + FDR chip row"
  ```

---

## Task 4: SortPickerSheet — new overlay component

**Files:**
- Create: `web/src/screens/TransferScreen/SortPickerSheet.tsx`
- Create: `web/src/screens/TransferScreen/SortPickerSheet.module.css`
- Create: `web/src/screens/TransferScreen/SortPickerSheet.test.tsx`

- [ ] **Step 1: Create the component**

  Create `web/src/screens/TransferScreen/SortPickerSheet.tsx`:

  ```tsx
  import React, { useEffect } from 'react';

  import { copy } from '@/lib/copy';

  import styles from './SortPickerSheet.module.css';

  export type SortKey = 'totalPoints' | 'nowCost' | 'form' | 'eventPoints' | 'selectedByPercent';

  export const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
    { key: 'totalPoints',       label: copy.transfersSortPts },
    { key: 'nowCost',           label: copy.transfersSortPrice },
    { key: 'form',              label: copy.transfersSortForm },
    { key: 'eventPoints',       label: copy.transfersSortGwPts },
    { key: 'selectedByPercent', label: copy.transfersSortSel },
  ];

  export interface SortPickerSheetProps {
    open: boolean;
    sortKey: SortKey;
    onSelect: (key: SortKey) => void;
    onClose: () => void;
  }

  export const SortPickerSheet: React.FC<SortPickerSheetProps> = ({
    open,
    sortKey,
    onSelect,
    onClose,
  }) => {
    useEffect(() => {
      if (!open) return;
      const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    return (
      <>
        <div
          className={`${styles.backdrop} ${open ? styles.backdropVisible : ''}`}
          aria-hidden="true"
          onClick={onClose}
        />
        <div
          className={`${styles.panel} ${open ? styles.panelOpen : ''}`}
          role={open ? 'dialog' : undefined}
          aria-modal={open ? 'true' : undefined}
          aria-label="Sort by"
          aria-hidden={open ? undefined : 'true'}
        >
          <div className={styles.handle} aria-hidden="true" />
          <ul className={styles.list} role="listbox" aria-label="Sort options">
            {SORT_OPTIONS.map((opt) => (
              <li
                key={opt.key}
                className={`${styles.option} ${sortKey === opt.key ? styles.option_active : ''}`}
                role="option"
                aria-selected={sortKey === opt.key}
                tabIndex={open ? 0 : -1}
                onClick={() => onSelect(opt.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(opt.key); }
                }}
              >
                <span className={styles.optionLabel}>{opt.label}</span>
                {sortKey === opt.key && <span className={styles.checkmark} aria-hidden="true">✓</span>}
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  };

  SortPickerSheet.displayName = 'SortPickerSheet';
  ```

- [ ] **Step 2: Create the CSS**

  Create `web/src/screens/TransferScreen/SortPickerSheet.module.css`:

  ```css
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
    z-index: 349;
  }

  .backdropVisible {
    opacity: 1;
    pointer-events: auto;
  }

  .panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-width: 30rem;
    margin: 0 auto;
    background: var(--fpl-bg-soft);
    border-radius: var(--fpl-radius-xl3) var(--fpl-radius-xl3) 0 0;
    border: 1px solid var(--fpl-bg-hair);
    border-bottom: none;
    z-index: 350;
    transform: translateY(100%);
    transition: transform 320ms cubic-bezier(0.32, 0.72, 0, 1);
    overflow: hidden;
  }

  .panelOpen {
    transform: translateY(0);
  }

  .handle {
    width: 2.25rem;
    height: 0.25rem;
    background: var(--fpl-bg-hair);
    border-radius: var(--fpl-radius-pill);
    margin: var(--fpl-space-sm) auto var(--fpl-space-xs);
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0 0 var(--fpl-space-md);
  }

  .option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--fpl-space-md) var(--fpl-space-md);
    cursor: pointer;
    border-bottom: 1px solid var(--fpl-bg-hair);
  }

  .option:last-child {
    border-bottom: none;
  }

  .option:active {
    background: rgba(255, 255, 255, 0.05);
  }

  .option_active .optionLabel {
    color: var(--fpl-accent);
  }

  .optionLabel {
    font-family: var(--fpl-font-display);
    font-size: var(--fpl-fs-body-s);
    font-weight: var(--fpl-fw-semibold);
    color: var(--fpl-text-primary);
    letter-spacing: 0.02em;
  }

  .checkmark {
    font-size: var(--fpl-fs-body-s);
    color: var(--fpl-accent);
    font-weight: var(--fpl-fw-bold);
  }
  ```

- [ ] **Step 3: Create test file**

  Create `web/src/screens/TransferScreen/SortPickerSheet.test.tsx`:

  ```tsx
  import { render, screen } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import { describe, expect, it, vi } from 'vitest';

  import { SortPickerSheet } from './SortPickerSheet';

  describe('SortPickerSheet', () => {
    it('shows all sort options when open', () => {
      render(
        <SortPickerSheet open sortKey="totalPoints" onSelect={vi.fn()} onClose={vi.fn()} />,
      );
      expect(screen.getByText('Pts')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Form')).toBeInTheDocument();
      expect(screen.getByText('GW pts')).toBeInTheDocument();
      expect(screen.getByText('Sel%')).toBeInTheDocument();
    });

    it('calls onSelect with the chosen key when an option is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <SortPickerSheet open sortKey="totalPoints" onSelect={onSelect} onClose={vi.fn()} />,
      );
      await user.click(screen.getByText('Price'));
      expect(onSelect).toHaveBeenCalledWith('nowCost');
    });

    it('calls onSelect with eventPoints when GW pts is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <SortPickerSheet open sortKey="totalPoints" onSelect={onSelect} onClose={vi.fn()} />,
      );
      await user.click(screen.getByText('GW pts'));
      expect(onSelect).toHaveBeenCalledWith('eventPoints');
    });

    it('calls onClose when the backdrop is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const { container } = render(
        <SortPickerSheet open sortKey="totalPoints" onSelect={vi.fn()} onClose={onClose} />,
      );
      const backdrop = container.querySelector('[aria-hidden="true"]') as HTMLElement;
      await user.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    });
  });
  ```

- [ ] **Step 4: Run tests**

  ```bash
  cd web && npx vitest run src/screens/TransferScreen/SortPickerSheet --reporter=verbose
  ```
  Expected: 4 tests pass.

- [ ] **Step 5: Commit**

  ```bash
  git add web/src/screens/TransferScreen/SortPickerSheet.tsx \
          web/src/screens/TransferScreen/SortPickerSheet.module.css \
          web/src/screens/TransferScreen/SortPickerSheet.test.tsx
  git commit -m "feat(SortPickerSheet): add sort overlay component (z-index 350)"
  ```

---

## Task 5: PlayerPickerSheet — position tabs + Sort button + SortPickerSheet integration

**Files:**
- Modify: `web/src/screens/TransferScreen/PlayerPickerSheet.tsx`
- Modify: `web/src/screens/TransferScreen/PlayerPickerSheet.module.css`
- Modify: `web/src/screens/TransferScreen/PlayerPickerSheet.test.tsx`

- [ ] **Step 1: Rewrite the component**

  Replace the entire `web/src/screens/TransferScreen/PlayerPickerSheet.tsx` with:

  ```tsx
  import React, { useMemo, useState } from 'react';

  import { BottomSheet } from '@/components/ui/BottomSheet/BottomSheet';
  import { copy, interpolate } from '@/lib/copy';
  import type { PoolPlayer } from '@/types';

  import { PlayerPickerRow } from './PlayerPickerRow';
  import { SORT_OPTIONS, SortPickerSheet } from './SortPickerSheet';
  import type { SortKey } from './SortPickerSheet';
  import styles from './PlayerPickerSheet.module.css';

  type PositionFilter = 'ALL' | 'DEF' | 'MID' | 'FWD';

  const POS_LABELS: Record<PositionFilter, string> = {
    ALL: copy.transfersPositionAll,
    DEF: copy.positionDEF,
    MID: copy.positionMID,
    FWD: copy.positionFWD,
  };

  const POS_FILTERS: PositionFilter[] = ['ALL', 'DEF', 'MID', 'FWD'];

  export interface PlayerPickerSheetProps {
    open: boolean;
    outPlayer: PoolPlayer;
    candidates: PoolPlayer[];
    availableBudget: number;
    squadTeamCounts: Map<number, number>;
    squadPlayerIds: Set<number>;
    isOutfield: boolean;
    onSelect: (player: PoolPlayer) => void;
    onClose: () => void;
  }

  export const PlayerPickerSheet: React.FC<PlayerPickerSheetProps> = ({
    open,
    outPlayer,
    candidates,
    availableBudget,
    squadTeamCounts,
    squadPlayerIds,
    isOutfield,
    onSelect,
    onClose,
  }) => {
    const [query, setQuery] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('totalPoints');
    const [positionFilter, setPositionFilter] = useState<PositionFilter>('ALL');
    const [showSort, setShowSort] = useState(false);

    const filtered = useMemo(() => {
      const q = query.toLowerCase();
      return candidates
        .filter((p) => !squadPlayerIds.has(p.id))
        .filter((p) => positionFilter === 'ALL' || p.position === positionFilter)
        .filter(
          (p) =>
            q === '' ||
            p.webName.toLowerCase().includes(q) ||
            p.firstName.toLowerCase().includes(q) ||
            p.lastName.toLowerCase().includes(q),
        )
        .sort((a, b) => {
          const aVal = parseFloat(String(a[sortKey]));
          const bVal = parseFloat(String(b[sortKey]));
          return bVal - aVal;
        });
    }, [candidates, query, sortKey, squadPlayerIds, positionFilter]);

    const title = interpolate(copy.transfersPickerTitle, { name: outPlayer.webName });
    const subtitle = interpolate(copy.transfersPickerSubtitle, {
      position: outPlayer.position,
      cost: (outPlayer.nowCost / 10).toFixed(1),
    });

    return (
      <>
        <BottomSheet open={open} onClose={onClose} title={title}>
          <div className={styles.inner}>
            <div className={styles.subheader}>
              <span className={styles.subtitle}>{subtitle}</span>
            </div>

            <div className={styles.controls}>
              <input
                className={styles.search}
                type="search"
                placeholder={copy.transfersPickerSearch}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className={styles.filterRow}>
                {isOutfield && (
                  <div className={styles.posTabs} role="group" aria-label="Filter by position">
                    {POS_FILTERS.map((pos) => (
                      <button
                        key={pos}
                        className={`${styles.posTab} ${positionFilter === pos ? styles.posTab_active : ''}`}
                        onClick={() => setPositionFilter(pos)}
                      >
                        {POS_LABELS[pos]}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  className={`${styles.sortBtn} ${!isOutfield ? styles.sortBtn_alone : ''}`}
                  onClick={() => setShowSort(true)}
                >
                  {copy.transfersSortButton}
                  <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" width="12" height="12">
                    <path d="M2 3.5h10M4 7h6M6 10.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            <ul className={styles.list}>
              {filtered.map((player) => {
                const countFromTeam = (squadTeamCounts.get(player.team) ?? 0)
                  - (outPlayer.team === player.team ? 1 : 0);
                const clubLimit = countFromTeam >= 3;
                return (
                  <PlayerPickerRow
                    key={player.id}
                    player={player}
                    overBudget={player.nowCost > availableBudget}
                    clubLimitReached={clubLimit}
                    onSelect={onSelect}
                  />
                );
              })}
            </ul>
          </div>
        </BottomSheet>
        <SortPickerSheet
          open={showSort}
          sortKey={sortKey}
          onSelect={(key) => { setSortKey(key); setShowSort(false); }}
          onClose={() => setShowSort(false)}
        />
      </>
    );
  };

  PlayerPickerSheet.displayName = 'PlayerPickerSheet';
  ```

- [ ] **Step 2: Update the CSS module**

  Replace the entire `web/src/screens/TransferScreen/PlayerPickerSheet.module.css` with:

  ```css
  .inner {
    display: flex;
    flex-direction: column;
    height: 70dvh;
  }

  .subheader {
    padding: 0 var(--fpl-space-md) var(--fpl-space-xs);
  }

  .subtitle {
    font-size: 0.75rem;
    color: var(--fpl-muted-soft);
  }

  .controls {
    padding: var(--fpl-space-xs) var(--fpl-space-md);
    display: flex;
    flex-direction: column;
    gap: var(--fpl-space-xs);
    border-bottom: 1px solid var(--fpl-bg-hair);
  }

  .search {
    width: 100%;
    padding: 0.5rem var(--fpl-space-sm);
    border-radius: var(--fpl-radius-sm);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--fpl-bg-hair);
    color: var(--fpl-text-primary);
    font-size: 0.875rem;
  }

  .search::placeholder {
    color: var(--fpl-muted-soft);
  }

  .filterRow {
    display: flex;
    align-items: center;
    gap: var(--fpl-space-xs);
  }

  .posTabs {
    display: flex;
    flex: 1;
    gap: 0.25rem;
  }

  .posTab {
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.6875rem;
    font-weight: 600;
    font-family: var(--fpl-font-display);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--fpl-bg-hair);
    color: var(--fpl-muted-soft);
    cursor: pointer;
    letter-spacing: 0.04em;
  }

  .posTab_active {
    background: var(--fpl-accent);
    color: #002210;
    border-color: transparent;
  }

  .sortBtn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.625rem;
    border-radius: 1rem;
    font-size: 0.6875rem;
    font-weight: 600;
    font-family: var(--fpl-font-display);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--fpl-bg-hair);
    color: var(--fpl-muted-soft);
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    margin-left: auto;
  }

  .sortBtn_alone {
    margin-left: auto;
  }

  .list {
    flex: 1;
    overflow-y: auto;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  ```

- [ ] **Step 3: Update the test file**

  Replace `web/src/screens/TransferScreen/PlayerPickerSheet.test.tsx` with:

  ```tsx
  import { render, screen } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import { describe, expect, it, vi } from 'vitest';

  import type { PoolPlayer } from '@/types';

  import { PlayerPickerSheet } from './PlayerPickerSheet';

  const makePoolPlayer = (id: number, overrides?: Partial<PoolPlayer>): PoolPlayer => ({
    id,
    webName: `Player${id}`,
    firstName: 'A',
    lastName: 'B',
    team: 1,
    teamCode: 3,
    teamShortName: 'ARS',
    position: 'MID',
    nowCost: 80,
    totalPoints: 100,
    eventPoints: 10,
    status: 'a',
    chanceOfPlaying: null,
    news: '',
    selectedByPercent: '10.0',
    form: '5.0',
    nextFixtures: [],
    ...overrides,
  });

  describe('PlayerPickerSheet', () => {
    const defaultProps = {
      open: true,
      outPlayer: makePoolPlayer(1, { webName: 'Saka', position: 'MID', nowCost: 95 }),
      candidates: [makePoolPlayer(2, { webName: 'Salah', nowCost: 130 })],
      availableBudget: 150,
      squadTeamCounts: new Map<number, number>([[1, 1]]),
      squadPlayerIds: new Set([1]),
      isOutfield: true,
      onSelect: vi.fn(),
      onClose: vi.fn(),
    };

    it('renders sheet title with player name', () => {
      render(<PlayerPickerSheet {...defaultProps} />);
      expect(screen.getByText(/Replace Saka/i)).toBeInTheDocument();
    });

    it('shows selling price in subtitle', () => {
      render(<PlayerPickerSheet {...defaultProps} />);
      expect(screen.getByText(/£9\.5m/)).toBeInTheDocument();
    });

    it('shows candidate player', () => {
      render(<PlayerPickerSheet {...defaultProps} />);
      expect(screen.getByText('Salah')).toBeInTheDocument();
    });

    it('calls onSelect when a candidate is clicked', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<PlayerPickerSheet {...defaultProps} onSelect={onSelect} />);
      await user.click(screen.getByText('Salah'));
      expect(onSelect).toHaveBeenCalledWith(defaultProps.candidates[0]);
    });

    it('filters candidates by search query', async () => {
      const user = userEvent.setup();
      const candidates = [
        makePoolPlayer(2, { webName: 'Salah' }),
        makePoolPlayer(3, { webName: 'Fernandes' }),
      ];
      render(<PlayerPickerSheet {...defaultProps} candidates={candidates} />);
      await user.type(screen.getByPlaceholderText(/search/i), 'sal');
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.queryByText('Fernandes')).not.toBeInTheDocument();
    });

    it('dims candidates over budget (opacity and non-interactive)', () => {
      render(
        <PlayerPickerSheet
          {...defaultProps}
          candidates={[makePoolPlayer(2, { webName: 'Expensive', nowCost: 200 })]}
          availableBudget={100}
        />,
      );
      const row = screen.getByText('Expensive').closest('[data-over-budget]');
      expect(row?.getAttribute('data-over-budget')).toBe('true');
    });

    it('shows position tabs when isOutfield is true', () => {
      render(<PlayerPickerSheet {...defaultProps} isOutfield={true} />);
      expect(screen.getByText('ALL')).toBeInTheDocument();
      expect(screen.getByText('DEF')).toBeInTheDocument();
      expect(screen.getByText('MID')).toBeInTheDocument();
      expect(screen.getByText('FWD')).toBeInTheDocument();
    });

    it('hides position tabs when isOutfield is false', () => {
      render(<PlayerPickerSheet {...defaultProps} isOutfield={false} />);
      expect(screen.queryByText('ALL')).not.toBeInTheDocument();
      expect(screen.queryByText('DEF')).not.toBeInTheDocument();
    });

    it('shows Sort button', () => {
      render(<PlayerPickerSheet {...defaultProps} />);
      expect(screen.getByText('Sort')).toBeInTheDocument();
    });

    it('filters outfield candidates by position tab', async () => {
      const user = userEvent.setup();
      const candidates = [
        makePoolPlayer(2, { webName: 'DefPlayer', position: 'DEF' }),
        makePoolPlayer(3, { webName: 'MidPlayer', position: 'MID' }),
      ];
      render(<PlayerPickerSheet {...defaultProps} candidates={candidates} isOutfield={true} />);
      await user.click(screen.getByText('DEF'));
      expect(screen.getByText('DefPlayer')).toBeInTheDocument();
      expect(screen.queryByText('MidPlayer')).not.toBeInTheDocument();
    });

    it('shows all candidates when ALL tab is active', async () => {
      const user = userEvent.setup();
      const candidates = [
        makePoolPlayer(2, { webName: 'DefPlayer', position: 'DEF' }),
        makePoolPlayer(3, { webName: 'MidPlayer', position: 'MID' }),
      ];
      render(<PlayerPickerSheet {...defaultProps} candidates={candidates} isOutfield={true} />);
      await user.click(screen.getByText('DEF'));
      await user.click(screen.getByText('ALL'));
      expect(screen.getByText('DefPlayer')).toBeInTheDocument();
      expect(screen.getByText('MidPlayer')).toBeInTheDocument();
    });
  });
  ```

- [ ] **Step 4: Run tests**

  ```bash
  cd web && npx vitest run src/screens/TransferScreen/PlayerPickerSheet --reporter=verbose
  ```
  Expected: 10 tests pass.

- [ ] **Step 5: Commit**

  ```bash
  git add web/src/screens/TransferScreen/PlayerPickerSheet.tsx \
          web/src/screens/TransferScreen/PlayerPickerSheet.module.css \
          web/src/screens/TransferScreen/PlayerPickerSheet.test.tsx
  git commit -m "feat(PlayerPickerSheet): add position tabs, Sort button, SortPickerSheet integration"
  ```

---

## Task 6: TransferPitch — poolLookup prop

**Files:**
- Modify: `web/src/screens/TransferScreen/TransferPitch.tsx`

- [ ] **Step 1: Add `poolLookup` prop and forward `nextFixture` to PlayerCard**

  Replace the entire `web/src/screens/TransferScreen/TransferPitch.tsx` with:

  ```tsx
  import React from 'react';

  import { Pitch } from '@/components/ui/Pitch/Pitch';
  import { PlayerCard } from '@/components/ui/PlayerCard/PlayerCard';
  import type { PlayerPosition, PoolPlayer, SquadPlayer } from '@/types';

  import styles from './TransferPitch.module.css';

  const POSITION_ORDER: PlayerPosition[] = ['FWD', 'MID', 'DEF', 'GK'];

  export interface TransferPitchProps {
    starters: SquadPlayer[];
    bench: SquadPlayer[];
    outPlayerId: number | null;
    inPlayerIds: Set<number>;
    onPlayerClick: (id: number) => void;
    poolLookup?: Map<number, PoolPlayer>;
  }

  function groupByPosition(players: SquadPlayer[]): Record<PlayerPosition, SquadPlayer[]> {
    const groups: Record<PlayerPosition, SquadPlayer[]> = { GK: [], DEF: [], MID: [], FWD: [] };
    for (const p of players) groups[p.position].push(p);
    return groups;
  }

  export const TransferPitch: React.FC<TransferPitchProps> = ({
    starters,
    bench,
    outPlayerId,
    inPlayerIds,
    onPlayerClick,
    poolLookup,
  }) => {
    const positionGroups = groupByPosition(starters);

    return (
      <div className={styles.pitchBench}>
        <div className={styles.pitchWrap}>
          <Pitch className={styles.pitchFill}>
            <div className={styles.pitchRows}>
              {POSITION_ORDER.map((pos) => (
                <div key={pos} className={styles.playerRow}>
                  {positionGroups[pos].map((player) => {
                    const isOut = player.id === outPlayerId;
                    const isIn = inPlayerIds.has(player.id);
                    return (
                      <button
                        key={player.id}
                        className={`${styles.playerBtn} ${isOut ? styles.playerBtn_out : ''} ${isIn ? styles.playerBtn_in : ''}`}
                        onClick={() => onPlayerClick(player.id)}
                        aria-label={`${player.name}${isOut ? ' (OUT)' : isIn ? ' (IN)' : ''}`}
                      >
                        <PlayerCard
                          player={player}
                          size="large"
                          hidePoints
                          nextFixture={poolLookup?.get(player.id)?.nextFixtures[0]}
                        />
                        {isOut && <span className={styles.variantBadge} data-variant="out">OUT</span>}
                        {isIn && (
                          <span className={styles.variantBadge} data-variant="in" aria-label="Transfer in">
                            <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                              <path d="M10.5 6A4.5 4.5 0 1 1 6 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                              <path d="M4.5 0L6.5 1.5L4.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </Pitch>
        </div>

        <div className={styles.bench}>
          {bench.map((player) => {
            const isOut = player.id === outPlayerId;
            const isIn = inPlayerIds.has(player.id);
            return (
              <button
                key={player.id}
                className={`${styles.playerBtn} ${isOut ? styles.playerBtn_out : ''} ${isIn ? styles.playerBtn_in : ''}`}
                onClick={() => onPlayerClick(player.id)}
                aria-label={`${player.name}${isOut ? ' (OUT)' : isIn ? ' (IN)' : ''}`}
              >
                <PlayerCard
                  player={player}
                  size="medium"
                  hidePoints
                  nextFixture={poolLookup?.get(player.id)?.nextFixtures[0]}
                />
                {isOut && <span className={styles.variantBadge} data-variant="out">OUT</span>}
                {isIn && (
                  <span className={styles.variantBadge} data-variant="in" aria-label="Transfer in">
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M10.5 6A4.5 4.5 0 1 1 6 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      <path d="M4.5 0L6.5 1.5L4.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  TransferPitch.displayName = 'TransferPitch';
  ```

- [ ] **Step 2: Verify TypeScript**

  ```bash
  cd web && npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add web/src/screens/TransferScreen/TransferPitch.tsx
  git commit -m "feat(TransferPitch): add poolLookup prop; forward nextFixture to PlayerCard"
  ```

---

## Task 7: TransferScreen — wire candidates, poolLookup, isOutfield

**Files:**
- Modify: `web/src/screens/TransferScreen/TransferScreen.tsx`

- [ ] **Step 1: Build poolLookup, widen candidates, add isOutfield, pass to children**

  In `web/src/screens/TransferScreen/TransferScreen.tsx`, make the following targeted changes:

  **Change 1:** Replace the `candidates` derivation at line 153–155:

  ```ts
  // Before:
  const candidates = outPlayer
    ? allPoolPlayers.filter((p) => p.position === outPlayer.position)
    : [];

  // After:
  const candidates = outPlayer
    ? outPlayer.position === 'GK'
      ? allPoolPlayers.filter((p) => p.position === 'GK')
      : allPoolPlayers.filter((p) => p.position !== 'GK')
    : [];
  ```

  **Change 2:** Add `poolLookup` and `isOutfield` derived values right after `candidates`:

  ```ts
  const poolLookup = useMemo(
    () => new Map(allPoolPlayers.map((p) => [p.id, p])),
    [allPoolPlayers],
  );

  const isOutfield = outPlayer ? outPlayer.position !== 'GK' : false;
  ```

  **Change 3:** Pass `poolLookup` to `<TransferPitch>` (around line 275):

  ```tsx
  <TransferPitch
    starters={displayStarters}
    bench={displayBench}
    outPlayerId={selectedPlayerId}
    inPlayerIds={inPlayerIds}
    onPlayerClick={handlePlayerClick}
    poolLookup={poolLookup}
  />
  ```

  **Change 4:** Add `isOutfield` prop to `<PlayerPickerSheet>` (around line 303):

  ```tsx
  <PlayerPickerSheet
    open={selectedPlayerId !== null}
    outPlayer={outPlayer}
    candidates={candidates}
    availableBudget={availableBudget}
    squadTeamCounts={squadTeamCounts}
    squadPlayerIds={squadPlayerIds}
    isOutfield={isOutfield}
    onSelect={handleSelectReplacement}
    onClose={() => setSelectedPlayerId(null)}
  />
  ```

- [ ] **Step 2: Verify TypeScript**

  ```bash
  cd web && npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 3: Run all transfer screen tests**

  ```bash
  cd web && npx vitest run src/screens/TransferScreen --reporter=verbose
  ```
  Expected: all tests pass.

- [ ] **Step 4: Commit**

  ```bash
  git add web/src/screens/TransferScreen/TransferScreen.tsx
  git commit -m "feat(TransferScreen): widen outfield candidates; wire poolLookup + isOutfield"
  ```

---

## Task 8: SquadScreen — fixture info on next-GW view

**Files:**
- Modify: `web/src/screens/SquadScreen/SquadScreen.tsx`

- [ ] **Step 1: Import `usePlayerPool` and add pool lookup for next GW**

  In `web/src/screens/SquadScreen/SquadScreen.tsx`:

  **Change 1:** Update the API import on line 6 to include `usePlayerPool`:

  ```ts
  // Before:
  import { useEntry, useGameweeks, useSquad } from '@/api/queries';

  // After:
  import { useEntry, useGameweeks, usePlayerPool, useSquad } from '@/api/queries';
  ```

  **Change 2:** Update the `maxGw` derivation (line 55) to allow navigating to the next GW:

  ```ts
  // Before:
  const maxGw = currentGw;

  // After:
  const maxGw = currentGw !== null ? currentGw + 1 : null;
  ```

  **Change 3:** After `useSquad` (after line 72), add pool data and lookup:

  ```ts
  const { data: poolData } = usePlayerPool();

  const isNextGw = currentGw !== null && selectedGw !== null && selectedGw === currentGw + 1;

  const poolLookup = useMemo(() => {
    if (!isNextGw || !poolData) return null;
    return new Map(poolData.players.map((p) => [p.id, p]));
  }, [isNextGw, poolData]);
  ```

  **Change 4:** Pass `nextFixture` to starters' PlayerCard (around line 281):

  ```tsx
  // Before:
  {positionGroups[pos].map((player) => (
    <PlayerCard key={player.id} player={player} size="large" />
  ))}

  // After:
  {positionGroups[pos].map((player) => (
    <PlayerCard
      key={player.id}
      player={player}
      size="large"
      nextFixture={poolLookup?.get(player.id)?.nextFixtures[0]}
    />
  ))}
  ```

  Bench players in SquadScreen do not receive `nextFixture` (bench cards are smaller; only starters are on the main pitch view).

- [ ] **Step 2: Verify TypeScript**

  ```bash
  cd web && npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 3: Run all tests**

  ```bash
  cd web && npx vitest run --reporter=verbose 2>&1 | tail -30
  ```
  Expected: all tests pass.

- [ ] **Step 4: Commit**

  ```bash
  git add web/src/screens/SquadScreen/SquadScreen.tsx
  git commit -m "feat(SquadScreen): show fixture info on next-GW view; extend maxGw to currentGw+1"
  ```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| Team abbrev + FDR chip below PlayerCard | Task 3 (PlayerCard prop + render) |
| Show in TransferScreen always | Task 6 (TransferScreen builds poolLookup) + Task 6 (TransferPitch forwards it) |
| Show in SquadScreen only when next GW | Task 8 (isNextGw guard + maxGw extension) |
| Captain badge → right, availability badge → left | Task 2 (CSS swap) |
| Outfield candidates: any non-GK position | Task 7 (candidates filter) |
| GK candidates: GK-only | Task 7 (GK branch unchanged) |
| Position tabs ALL/DEF/MID/FWD | Task 5 (PlayerPickerSheet filterRow + posTabs) |
| Position tabs only for outfield picks | Task 5 (isOutfield prop controls tab render) |
| Sort button opens SortPickerSheet | Task 5 (showSort state + SortPickerSheet sibling) |
| SortPickerSheet z-index above BottomSheet | Task 4 (z-index 350 > 300) |
| Sort options: Pts, Price, Form, GW pts, Sel% | Task 4 (SORT_OPTIONS) |

**Placeholder scan:** No TBDs found — all steps include complete code.

**Type consistency check:**
- `SortKey` is defined once in `SortPickerSheet.tsx` and imported in `PlayerPickerSheet.tsx` ✓
- `SORT_OPTIONS` defined in `SortPickerSheet.tsx`, was removed from `PlayerPickerSheet.tsx` ✓
- `poolLookup` is `Map<number, PoolPlayer>` in both `TransferPitch` and `TransferScreen` ✓
- `nextFixture` is `FixtureInfo | undefined` flowing consistently from pool lookup to `PlayerCard` ✓
- `isOutfield: boolean` is a required prop on `PlayerPickerSheet` — `TransferScreen` passes it, tests pass it ✓
