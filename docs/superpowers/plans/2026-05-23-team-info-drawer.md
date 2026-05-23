# Team Info Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mobile inline-expand of `TeamInfoPanel` with a slide-in drawer that overlays squad content, opened by a burger button in the header.

**Architecture:** New reusable `Drawer` component wraps `TeamInfoPanel` in `SquadScreen`. On mobile (`< 56.25rem`) it renders as a fixed overlay with CSS transform animation and touch swipe-to-dismiss. On desktop (`≥ 56.25rem`) it is a transparent pass-through wrapper so the existing permanent sidebar behaviour is unchanged. `SquadScreen` owns the `drawerOpen: boolean` state and passes a burger button open trigger and FPL mark + team name as the `header` prop of the drawer.

**Tech Stack:** React 18, TypeScript, CSS Modules (no new dependencies), Vitest + React Testing Library.

---

## File Map

| File | Action |
|---|---|
| `web/src/lib/copy.ts` | Modify — remove expand/collapse labels; add drawer label and open label |
| `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx` | Modify — remove mobile toggle button, chevron, `expanded` state |
| `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.module.css` | Modify — remove toggle styles; make `.body` always `display: flex` |
| `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.test.tsx` | Modify — remove toggle test; add assertion that no toggle button is rendered |
| `web/src/components/ui/Drawer/Drawer.tsx` | Create |
| `web/src/components/ui/Drawer/Drawer.module.css` | Create |
| `web/src/components/ui/Drawer/Drawer.test.tsx` | Create |
| `web/src/screens/SquadScreen/SquadScreen.tsx` | Modify — add `drawerOpen` state, burger button, `Drawer` wrapping `TeamInfoPanel` |
| `web/src/screens/SquadScreen/SquadScreen.module.css` | Modify — add burger button styles |
| `web/src/screens/SquadScreen/SquadScreen.test.tsx` | Create — burger button + drawer open/close integration tests |

---

## Task 1: Update copy module

**Files:**
- Modify: `web/src/lib/copy.ts`

- [ ] **Step 1: Remove expand/collapse keys and add drawer keys**

In `web/src/lib/copy.ts`, replace the two `teamInfo*AriaLabel` keys and add two new ones:

```ts
  // Team info panel
  teamInfoOverallPts: 'Overall pts',
  teamInfoOverallRank: 'Overall rank',
  teamInfoGwPts: 'GW pts',
  teamInfoTotalPlayers: 'Total players',
  teamInfoGwHistory: 'Gameweek History',
  teamInfoDrawerLabel: 'Team information',
  teamInfoOpenDrawer: 'Open team info',
```

(Delete the lines `teamInfoExpandAriaLabel` and `teamInfoCollapseAriaLabel` entirely.)

- [ ] **Step 2: Run the full unit test suite to confirm no regressions**

```bash
cd web && npx vitest run --reporter=verbose --project=unit
```

Expected: all tests pass (the deleted copy keys are only used in `TeamInfoPanel.tsx` which we are about to update).

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/copy.ts
git commit -m "refactor(copy): replace team panel toggle labels with drawer labels"
```

---

## Task 2: Simplify TeamInfoPanel

Remove the mobile toggle button, chevron, and `expanded` React state. The panel becomes a pure content component — open/close is now the Drawer's responsibility.

**Files:**
- Modify: `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.test.tsx`
- Modify: `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx`
- Modify: `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.module.css`

- [ ] **Step 1: Update the test file — remove toggle test, add no-toggle assertion**

Replace the entire `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { fixtureEntry } from '@/fixtures';

import { TeamInfoPanel } from './TeamInfoPanel';

function renderPanel(overrides: Partial<typeof fixtureEntry> = {}) {
  const entry = { ...fixtureEntry, ...overrides };
  return render(
    <MemoryRouter>
      <TeamInfoPanel entry={entry} teamId={entry.teamId} />
    </MemoryRouter>,
  );
}

describe('TeamInfoPanel', () => {
  it('renders team name', () => {
    renderPanel();
    expect(screen.getByText('Amorim_out')).toBeInTheDocument();
  });

  it('renders manager name', () => {
    renderPanel();
    expect(screen.getByText(/Ivan Iuriev/)).toBeInTheDocument();
  });

  it('renders overall points formatted', () => {
    renderPanel({ overallPoints: 2156 });
    expect(screen.getByText('2,156')).toBeInTheDocument();
  });

  it('renders overall rank formatted', () => {
    renderPanel({ overallRank: 142857 });
    expect(screen.getByText('142,857')).toBeInTheDocument();
  });

  it('renders GW points', () => {
    renderPanel({ eventPoints: 67 });
    expect(screen.getByText('67')).toBeInTheDocument();
  });

  it('renders total players formatted', () => {
    renderPanel({ totalPlayers: 10500000 });
    expect(screen.getByText('10,500,000')).toBeInTheDocument();
  });

  it('renders flag emoji when regionIsoCode is present', () => {
    renderPanel({ regionIsoCode: 'UA' });
    expect(screen.getByText('🇺🇦')).toBeInTheDocument();
  });

  it('omits flag when regionIsoCode is absent', () => {
    renderPanel({ regionIsoCode: undefined });
    expect(screen.queryByText('🇺🇦')).toBeNull();
  });

  it('renders Gameweek History link', () => {
    renderPanel();
    expect(screen.getByRole('link', { name: /Gameweek History/i })).toBeInTheDocument();
  });

  it('Gameweek History link points to /history with teamId', () => {
    renderPanel();
    const link = screen.getByRole('link', { name: /Gameweek History/i });
    expect(link.getAttribute('href')).toBe('/history?teamId=72828');
  });

  it('does not render a toggle button', () => {
    renderPanel();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to confirm the new assertions fail**

```bash
cd web && npx vitest run --reporter=verbose --project=unit src/components/ui/TeamInfoPanel
```

Expected: `'does not render a toggle button'` FAILS (toggle button still present), `'renders team name'` also FAILS (`getAllByText` changed to `getByText` — the duplicate in `mobileTeamName` is gone once we simplify, but right now it's still there so `getByText` may throw "found more than one").

- [ ] **Step 3: Replace TeamInfoPanel.tsx**

Replace the entire `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx` with:

```tsx
import React from 'react';
import { Link } from 'react-router-dom';

import { copy } from '@/lib/copy';
import type { EntryResponse } from '@/types';

import styles from './TeamInfoPanel.module.css';

function isoToFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.codePointAt(0)! - 65 + 0x1f1e6))
    .join('');
}

function fmt(n: number): string {
  return n.toLocaleString('en-GB');
}

export interface TeamInfoPanelProps {
  entry: EntryResponse;
  teamId: number;
}

export const TeamInfoPanel: React.FC<TeamInfoPanelProps> = ({ entry, teamId }) => {
  const flag = entry.regionIsoCode ? isoToFlag(entry.regionIsoCode) : null;

  return (
    <aside className={styles.panel}>
      <div className={styles.avatarWrap} aria-hidden="true">
        <div className={styles.avatar} />
      </div>

      <div className={styles.identity}>
        <span className={styles.teamName}>{entry.teamName}</span>
        <span className={styles.manager}>
          {flag && <span aria-hidden="true">{flag} </span>}
          {entry.managerName}
        </span>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{fmt(entry.overallPoints)}</span>
          <span className={styles.statLabel}>{copy.teamInfoOverallPts}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{fmt(entry.overallRank)}</span>
          <span className={styles.statLabel}>{copy.teamInfoOverallRank}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{fmt(entry.eventPoints)}</span>
          <span className={styles.statLabel}>{copy.teamInfoGwPts}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{fmt(entry.totalPlayers)}</span>
          <span className={styles.statLabel}>{copy.teamInfoTotalPlayers}</span>
        </div>
      </div>

      <Link to={`/history?teamId=${teamId}`} className={styles.historyLink}>
        {copy.teamInfoGwHistory}
      </Link>
    </aside>
  );
};

TeamInfoPanel.displayName = 'TeamInfoPanel';
```

- [ ] **Step 4: Replace TeamInfoPanel.module.css**

Replace the entire `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.module.css` with:

```css
.panel {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--fpl-space-xl);
  padding: var(--fpl-space-xl) var(--fpl-space-xl3);
}

/* ── Identity ──────────────────────────────────────────────── */

.avatarWrap {
  display: flex;
  justify-content: center;
}

.avatar {
  width: 4rem;
  height: 4rem;
  border-radius: var(--fpl-radius-pill);
  background: var(--fpl-bg-hair);
}

.identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  text-align: center;
}

.teamName {
  font-size: var(--fpl-fs-body-l);
  font-weight: var(--fpl-fw-bold);
  color: var(--fpl-text);
  letter-spacing: var(--fpl-tr-head-m);
}

.manager {
  font-size: var(--fpl-fs-body-s);
  color: var(--fpl-muted);
}

/* ── Stats grid ────────────────────────────────────────────── */

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--fpl-space-sm);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--fpl-bg-hair);
  border-radius: var(--fpl-radius-md);
  padding: var(--fpl-space-sm);
}

.statValue {
  font-family: var(--fpl-font-mono), serif;
  font-size: var(--fpl-fs-title);
  font-weight: var(--fpl-fw-bold);
  color: var(--fpl-text);
}

.statLabel {
  font-size: var(--fpl-fs-micro);
  font-weight: var(--fpl-fw-medium);
  color: var(--fpl-muted-soft);
  text-transform: uppercase;
  letter-spacing: var(--fpl-tr-cap-s);
  text-align: center;
}

/* ── Gameweek History link ─────────────────────────────────── */

.historyLink {
  display: block;
  text-align: center;
  padding: var(--fpl-space-sm) var(--fpl-space-md);
  border: 1px solid var(--fpl-bg-hair);
  border-radius: var(--fpl-radius-pill);
  font-size: var(--fpl-fs-body-s);
  font-weight: var(--fpl-fw-semibold);
  color: var(--fpl-text-soft);
  text-decoration: none;
  transition: border-color 120ms, color 120ms;
}

.historyLink:hover {
  border-color: var(--fpl-accent);
  color: var(--fpl-accent);
}

/* ── Desktop sidebar ───────────────────────────────────────── */

@media (min-width: 56.25rem) {
  .panel {
    padding: var(--fpl-space-xl3);
  }

  .identity {
    align-items: flex-start;
    text-align: left;
  }

  .avatarWrap {
    justify-content: flex-start;
  }
}
```

- [ ] **Step 5: Run tests and confirm all pass**

```bash
cd web && npx vitest run --reporter=verbose --project=unit src/components/ui/TeamInfoPanel
```

Expected: all 11 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/ui/TeamInfoPanel/
git commit -m "refactor(TeamInfoPanel): remove mobile toggle — open/close now owned by Drawer"
```

---

## Task 3: Create the Drawer component

**Files:**
- Create: `web/src/components/ui/Drawer/Drawer.test.tsx`
- Create: `web/src/components/ui/Drawer/Drawer.tsx`
- Create: `web/src/components/ui/Drawer/Drawer.module.css`

- [ ] **Step 1: Write the failing tests**

Create `web/src/components/ui/Drawer/Drawer.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Drawer } from './Drawer';

function renderDrawer(open = true, onClose = vi.fn(), header?: React.ReactNode) {
  return render(
    <Drawer open={open} onClose={onClose} header={header} ariaLabel="Team information">
      <p>panel content</p>
    </Drawer>,
  );
}

describe('Drawer', () => {
  it('renders children', () => {
    renderDrawer();
    expect(screen.getByText('panel content')).toBeInTheDocument();
  });

  it('has role dialog with aria-label when open', () => {
    renderDrawer(true);
    expect(screen.getByRole('dialog', { name: 'Team information' })).toBeInTheDocument();
  });

  it('does not have role dialog when closed', () => {
    renderDrawer(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders header content when provided', () => {
    renderDrawer(true, vi.fn(), <span>Header slot</span>);
    expect(screen.getByText('Header slot')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDrawer(true, onClose);
    await user.click(screen.getByTestId('drawer-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed while open', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDrawer(true, onClose);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape when closed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDrawer(false, onClose);
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose on close button click', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDrawer(true, onClose);
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose after swipe right past threshold (> 80px)', () => {
    const onClose = vi.fn();
    renderDrawer(true, onClose);
    const panel = screen.getByRole('dialog');
    fireEvent.touchStart(panel, { touches: [{ clientX: 0 }] });
    fireEvent.touchMove(panel, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(panel, { changedTouches: [{ clientX: 100 }] });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose after short swipe below threshold (< 80px)', () => {
    const onClose = vi.fn();
    renderDrawer(true, onClose);
    const panel = screen.getByRole('dialog');
    fireEvent.touchStart(panel, { touches: [{ clientX: 0 }] });
    fireEvent.touchMove(panel, { touches: [{ clientX: 30 }] });
    fireEvent.touchEnd(panel, { changedTouches: [{ clientX: 30 }] });
    expect(onClose).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd web && npx vitest run --reporter=verbose --project=unit src/components/ui/Drawer
```

Expected: FAIL — `Cannot find module './Drawer'`.

- [ ] **Step 3: Create the Drawer component**

Create `web/src/components/ui/Drawer/Drawer.tsx`:

```tsx
import React, { useEffect, useRef } from 'react';

import { copy } from '@/lib/copy';

import styles from './Drawer.module.css';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  header?: React.ReactNode;
  children: React.ReactNode;
}

const SWIPE_THRESHOLD_PX = 80;

export const Drawer: React.FC<DrawerProps> = ({ open, onClose, ariaLabel, header, children }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    draggingRef.current = true;
    if (panelRef.current) {
      panelRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggingRef.current || !panelRef.current) return;
    const deltaX = Math.max(0, e.touches[0].clientX - startXRef.current);
    panelRef.current.style.transform = `translateX(${deltaX}px)`;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!draggingRef.current || !panelRef.current) return;
    draggingRef.current = false;
    const deltaX = Math.max(0, e.changedTouches[0].clientX - startXRef.current);
    const drawerWidth = panelRef.current.offsetWidth;
    const threshold = Math.max(SWIPE_THRESHOLD_PX, drawerWidth * 0.35);

    panelRef.current.style.transition = '';
    panelRef.current.style.transform = '';

    if (deltaX >= threshold) {
      onClose();
    }
  };

  return (
    <>
      <div
        className={`${styles.backdrop} ${open ? styles.backdropVisible : ''}`}
        aria-hidden="true"
        data-testid="drawer-backdrop"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={`${styles.panel} ${open ? styles.panelOpen : ''}`}
        role={open ? 'dialog' : undefined}
        aria-modal={open ? 'true' : undefined}
        aria-label={open ? ariaLabel : undefined}
        tabIndex={-1}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerHeaderContent}>{header}</div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={copy.closeButton}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </>
  );
};

Drawer.displayName = 'Drawer';
```

- [ ] **Step 4: Create Drawer.module.css**

Create `web/src/components/ui/Drawer/Drawer.module.css`:

```css
/* ── Backdrop ──────────────────────────────────────────────── */

.backdrop {
  position: fixed;
  inset: 0;
  background: transparent;
  pointer-events: none;
  z-index: 299;
  transition: background 300ms ease-out;
}

.backdropVisible {
  background: rgba(0, 0, 0, 0.55);
  pointer-events: auto;
}

/* ── Panel ─────────────────────────────────────────────────── */

.panel {
  position: fixed;
  top: 0;
  left: 0;
  height: 100dvh;
  width: calc(100% - 1.5rem);
  background: var(--fpl-bg-deep);
  border-right: 1px solid var(--fpl-bg-hair);
  z-index: 300;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 300ms ease-out;
  outline: none;
  overflow: hidden;
}

.panelOpen {
  transform: translateX(0);
}

/* ── Drawer header ─────────────────────────────────────────── */

.drawerHeader {
  flex-shrink: 0;
  height: 3.25rem;
  display: flex;
  align-items: center;
  padding: 0 var(--fpl-space-xl3);
  border-bottom: 1px solid var(--fpl-bg-hair);
  gap: var(--fpl-space-md);
}

.drawerHeaderContent {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--fpl-space-md);
  min-width: 0;
}

.closeBtn {
  width: 2rem;
  height: 2rem;
  border-radius: var(--fpl-radius-pill);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--fpl-bg-hair);
  color: var(--fpl-muted-soft);
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 120ms, color 120ms;
}

.closeBtn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--fpl-text);
}

.closeBtn svg {
  width: 0.75rem;
  height: 0.75rem;
}

/* ── Desktop: transparent pass-through ────────────────────── */

@media (min-width: 56.25rem) {
  .backdrop {
    display: none;
  }

  .panel {
    position: static;
    height: 100%;
    width: 100%;
    transform: none;
    transition: none;
    z-index: auto;
    border-right: 1px solid var(--fpl-bg-hair);
    overflow: hidden;
  }

  .drawerHeader {
    display: none;
  }
}
```

- [ ] **Step 5: Run tests and confirm all pass**

```bash
cd web && npx vitest run --reporter=verbose --project=unit src/components/ui/Drawer
```

Expected: all 10 tests PASS.

- [ ] **Step 6: Run full test suite**

```bash
cd web && npx vitest run --reporter=verbose --project=unit
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/ui/Drawer/
git commit -m "feat(Drawer): add slide-in overlay drawer with swipe-to-dismiss"
```

---

## Task 4: Wire Drawer into SquadScreen

Add burger button to the header, `drawerOpen` state, and wrap `TeamInfoPanel` in `Drawer`.

**Files:**
- Create: `web/src/screens/SquadScreen/SquadScreen.test.tsx`
- Modify: `web/src/screens/SquadScreen/SquadScreen.tsx`
- Modify: `web/src/screens/SquadScreen/SquadScreen.module.css`

- [ ] **Step 1: Write the failing SquadScreen tests**

Create `web/src/screens/SquadScreen/SquadScreen.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { fixtureEntry, fixtureGameweeks } from '@/fixtures';

vi.mock('@/api/queries', () => ({
  useEntry: () => ({ data: fixtureEntry, isError: false }),
  useGameweeks: () => ({ data: fixtureGameweeks }),
  useSquad: () => ({ data: null, isLoading: false, isError: false, error: null, refetch: vi.fn() }),
}));

import { SquadScreen } from './SquadScreen';

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/?teamId=72828']}>
      <SquadScreen teamId={72828} />
    </MemoryRouter>,
  );
}

describe('SquadScreen drawer', () => {
  it('renders a burger button in the header', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: /open team info/i })).toBeInTheDocument();
  });

  it('drawer is closed on initial render', () => {
    renderScreen();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('clicking the burger button opens the drawer', async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.click(screen.getByRole('button', { name: /open team info/i }));
    expect(screen.getByRole('dialog', { name: /team information/i })).toBeInTheDocument();
  });

  it('clicking the backdrop closes the drawer', async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.click(screen.getByRole('button', { name: /open team info/i }));
    await user.click(screen.getByTestId('drawer-backdrop'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd web && npx vitest run --reporter=verbose --project=unit src/screens/SquadScreen
```

Expected: FAIL — `Cannot find module './SquadScreen'` (no test existed) or the burger button tests fail because the button does not exist yet.

- [ ] **Step 3: Update SquadScreen.tsx**

Replace the `return (...)` block and the imports in `web/src/screens/SquadScreen/SquadScreen.tsx`. Add the `Drawer` import, `drawerOpen` state, burger button, and `Drawer` wrapper. The full file becomes:

```tsx
import React, { useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { useSearchParams } from 'react-router-dom';

import { ApiError } from '@/api/client';
import { useEntry, useGameweeks, useSquad } from '@/api/queries';
import { Button } from '@/components/ui/Button/Button';
import { Drawer } from '@/components/ui/Drawer/Drawer';
import { ListView, ListViewSkeleton } from '@/components/ui/ListView/ListView';
import { Pitch } from '@/components/ui/Pitch/Pitch';
import { PlayerCard } from '@/components/ui/PlayerCard/PlayerCard';
import { SummaryStrip } from '@/components/ui/SummaryStrip/SummaryStrip';
import { TeamInfoPanel } from '@/components/ui/TeamInfoPanel/TeamInfoPanel';
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle/ViewToggle';
import { copy, interpolate } from '@/lib/copy';
import type { PlayerPosition, SquadPlayer } from '@/types';
import { MAX_GAMEWEEK } from '@/types';

import styles from './SquadScreen.module.css';

export interface SquadScreenProps {
  teamId: number;
}

const POSITION_ORDER: PlayerPosition[] = ['FWD', 'MID', 'DEF', 'GK'];

function withTransition(update: () => void): void {
  if (!document.startViewTransition) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}

function groupByPosition(players: SquadPlayer[]): Record<PlayerPosition, SquadPlayer[]> {
  const groups: Record<PlayerPosition, SquadPlayer[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of players) {
    groups[p.position].push(p);
  }
  return groups;
}

function benchLabel(index: number, position: PlayerPosition): string {
  return position === 'GK' ? 'GKP' : `${index}. ${position}`;
}

export const SquadScreen: React.FC<SquadScreenProps> = ({ teamId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: gameweeksData } = useGameweeks();
  const { data: entry, isError: entryIsError } = useEntry(teamId);

  const currentGw = gameweeksData?.current ?? null;
  const maxGw = currentGw;

  const gwParam = searchParams.get('gw');
  const selectedGw = useMemo(() => {
    if (gwParam) {
      const n = Number(gwParam);
      if (Number.isInteger(n) && n >= 1 && n <= MAX_GAMEWEEK) return n;
    }
    return currentGw;
  }, [gwParam, currentGw]);

  const viewParam = searchParams.get('view');
  const view: ViewMode = viewParam === 'list' ? 'list' : 'pitch';

  const { data: squad, isLoading, isError: squadIsError, error: squadError, refetch } = useSquad(
    entryIsError ? null : teamId,
    selectedGw,
  );

  const isNoSquad = squadIsError && squadError instanceof ApiError && squadError.status === 404;
  const isSquadError = squadIsError && !isNoSquad;

  const jumpToCurrent = () => {
    if (currentGw === null) return;
    withTransition(() =>
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set('gw', String(currentGw));
        return p;
      }),
    );
  };

  const canGoPrev = selectedGw !== null && selectedGw > 1;
  const canGoNext = selectedGw !== null && maxGw !== null && selectedGw < maxGw;

  const navigateGw = (delta: number) => {
    if (selectedGw === null) return;
    const next = selectedGw + delta;
    withTransition(() =>
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set('gw', String(next));
        return p;
      }),
    );
  };

  const handleViewChange = (mode: ViewMode) => {
    withTransition(() =>
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set('view', mode);
        return p;
      }),
    );
  };

  const handleChangeTeam = () => {
    setSearchParams({});
  };

  const positionGroups = useMemo(() => {
    if (!squad) return null;
    return groupByPosition(squad.starters);
  }, [squad]);

  const gwLabel =
    selectedGw !== null
      ? `${copy.squadGameweekLabel} ${selectedGw}`
      : copy.squadGameweekLabel;

  const drawerHeader = entry ? (
    <>
      <div className={styles.fplMark} aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none">
          <path
            d="M3 17 L7 3 L11 3 L9 9 L13 9 L11 13 L15 13 L9 19 L11 13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className={styles.teamInfo}>
        <span className={styles.teamName}>{entry.teamName}</span>
        <span className={styles.teamId}>{'ID · ' + teamId}</span>
      </div>
    </>
  ) : null;

  return (
    <div className={styles.screen}>
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ariaLabel={copy.teamInfoDrawerLabel}
        header={drawerHeader}
      >
        {entry && <TeamInfoPanel entry={entry} teamId={teamId} />}
      </Drawer>

      <div className={styles.squadCol}>
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <div className={styles.headerLeft}>
              <button
                className={styles.burgerBtn}
                onClick={() => setDrawerOpen(true)}
                aria-label={copy.teamInfoOpenDrawer}
              >
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <div className={styles.fplMark} aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="M3 17 L7 3 L11 3 L9 9 L13 9 L11 13 L15 13 L9 19 L11 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className={styles.teamInfo}>
                <span className={styles.teamName}>{entry?.teamName ?? ' '}</span>
                <span className={styles.teamId}>{'ID · ' + teamId}</span>
              </div>
            </div>
            <Button variant="link" onClick={handleChangeTeam}>
              {copy.squadChangeTeam}
            </Button>
          </div>

          <div className={styles.viewToggleWrap}>
            <ViewToggle value={view} onChange={handleViewChange} />
          </div>

          <div className={styles.gwNav}>
            <button
              className={styles.navBtn}
              onClick={() => navigateGw(-1)}
              disabled={!canGoPrev}
              aria-label="Previous gameweek"
            >
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className={styles.gwLabel}>{gwLabel}</span>
            <button
              className={styles.navBtn}
              onClick={() => navigateGw(1)}
              disabled={!canGoNext}
              aria-label="Next gameweek"
            >
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={styles.chevronRight}>
                <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </header>

        {squad && (
          <div className={styles.summaryWrap}>
            <SummaryStrip summary={squad.summary} />
          </div>
        )}
        {isLoading && <div className={styles.summaryPlaceholder} aria-hidden="true" />}

        {isLoading && (
          view === 'list' ? <ListViewSkeleton /> : <SquadSkeleton />
        )}

        {entryIsError && (
          <div className={styles.stateCenter}>
            <p className={styles.stateText}>{copy.squadNotFound}</p>
            <Button variant="secondary" onClick={handleChangeTeam}>
              {copy.squadChangeTeam}
            </Button>
          </div>
        )}

        {isSquadError && (
          <div className={styles.stateCenter}>
            <p className={styles.stateText}>{copy.squadLoadError}</p>
            <Button variant="secondary" onClick={() => refetch()}>
              {copy.squadRetry}
            </Button>
          </div>
        )}

        {isNoSquad && (
          <div className={styles.stateCenter}>
            <div className={styles.emptyPitchIcon}>
              <Pitch>
                <div className={styles.emptyPitchQ}>?</div>
              </Pitch>
            </div>
            <p className={styles.stateHeading}>{copy.squadEmptyHeading}</p>
            <p className={styles.stateText}>
              {interpolate(copy.squadEmptySubtext, { GW: selectedGw ?? '' })}
            </p>
            {currentGw !== null && selectedGw !== currentGw && (
              <Button variant="primary" onClick={jumpToCurrent}>
                {copy.squadJumpToCurrent}
              </Button>
            )}
          </div>
        )}

        {squad && squad.starters.length > 0 && (
          view === 'list' ? (
            <ListView starters={squad.starters} bench={squad.bench} />
          ) : (
            positionGroups && (
              <div className={styles.pitchBench}>
                <div className={styles.pitchWrap}>
                  <Pitch className={styles.pitchFill}>
                    <div className={styles.pitchRows}>
                      {POSITION_ORDER.map((pos) => (
                        <div key={pos} className={styles.playerRow}>
                          {positionGroups[pos].map((player) => (
                            <PlayerCard key={player.id} player={player} size="large" />
                          ))}
                        </div>
                      ))}
                    </div>
                  </Pitch>
                </div>

                <div className={styles.bench}>
                  <div className={styles.benchLabels}>
                    {squad.bench.map((player, i) => (
                      <span key={player.id} className={styles.benchLabel}>
                        {benchLabel(i, player.position)}
                      </span>
                    ))}
                  </div>
                  <div className={styles.benchRow}>
                    {squad.bench.map((player) => (
                      <PlayerCard key={player.id} player={player} size="medium" />
                    ))}
                  </div>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
};

SquadScreen.displayName = 'SquadScreen';

function SquadSkeleton() {
  return (
    <div className={styles.pitchBench} aria-label={copy.loadingPlaceholder} aria-busy="true">
      <div className={styles.pitchWrap}>
        <Pitch className={styles.pitchFill}>
          <div className={styles.skeletonVeil} />
          <div className={styles.pitchRows}>
            {[2, 4, 4, 1].map((count, rowIdx) => (
              <div key={rowIdx} className={styles.playerRow}>
                {Array.from({ length: count }).map((_, i) => (
                  <PlayerSkeleton key={i} size="large" />
                ))}
              </div>
            ))}
          </div>
        </Pitch>
      </div>
      <div className={styles.bench}>
        <div className={styles.benchLabels}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeletonLabel} />
          ))}
        </div>
        <div className={styles.benchRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <PlayerSkeleton key={i} size="medium" />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerSkeleton({ size }: { size: 'large' | 'medium' }) {
  return (
    <div className={`${styles.skeletonPlayer} ${styles[`skeletonPlayer_${size}`]}`}>
      <div className={styles.skeletonJersey} />
      <div className={styles.skeletonNameBar} />
    </div>
  );
}
```

- [ ] **Step 4: Add burger button styles to SquadScreen.module.css**

Add the `.burgerBtn` rule after the `.headerLeft` rule. Also hide the burger on desktop. Find this block in `SquadScreen.module.css`:

```css
.headerLeft {
  display: flex;
  align-items: center;
  gap: var(--fpl-space-md);
  min-width: 0;
  flex: 1;
}
```

Add after it:

```css
.burgerBtn {
  width: var(--fpl-size-avatar);
  height: var(--fpl-size-avatar);
  border-radius: var(--fpl-radius-sm);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--fpl-bg-hair);
  color: var(--fpl-muted-soft);
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 120ms, color 120ms;
}

.burgerBtn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--fpl-text);
}

.burgerBtn svg {
  width: 55%;
  height: 55%;
}
```

Also find the existing desktop media query:

```css
@media (min-width: 56.25rem) {
  .screen {
    display: grid;
    grid-template-columns: 16rem 1fr;
    max-width: none;
    margin: 0;
  }
```

Add `.burgerBtn { display: none; }` inside that media query block:

```css
@media (min-width: 56.25rem) {
  .screen {
    display: grid;
    grid-template-columns: 16rem 1fr;
    max-width: none;
    margin: 0;
  }

  .burgerBtn {
    display: none;
  }

  .squadCol {
    height: 100vh;
    overflow: hidden;
  }
}
```

- [ ] **Step 5: Run SquadScreen tests**

```bash
cd web && npx vitest run --reporter=verbose --project=unit src/screens/SquadScreen
```

Expected: all 4 tests PASS.

- [ ] **Step 6: Run full test suite**

```bash
cd web && npx vitest run --reporter=verbose --project=unit
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add web/src/screens/SquadScreen/ web/src/components/ui/TeamInfoPanel/
git commit -m "feat(SquadScreen): add burger button and Drawer wrapper for TeamInfoPanel"
```
