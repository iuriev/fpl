# TeamInfoPanel Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shimmer skeleton to `TeamInfoPanel` that renders inside the Drawer while `entry` data is loading, replacing the current empty dark void.

**Architecture:** A new `TeamInfoPanelSkeleton` component is co-located in `TeamInfoPanel.tsx` alongside the existing panel. Skeleton-specific CSS classes (shimmer bars/blocks) are added to `TeamInfoPanel.module.css`. `SquadScreen` conditionally renders the skeleton when `entry` is null and no error has occurred.

**Tech Stack:** React, CSS Modules, `fplShimmer` keyframe (already defined globally in `theme/colors_and_type.css`)

---

### Task 1: Add skeleton CSS classes to TeamInfoPanel.module.css

**Files:**
- Modify: `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.module.css`

- [ ] **Step 1: Add shimmer base mixin and skeleton classes**

Append the following to the end of `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.module.css`:

```css
/* ── Skeleton ──────────────────────────────────────────────── */

.skeletonBase {
  border-radius: var(--fpl-radius-sm);
  background: rgba(255, 255, 255, 0.08);
  background-image: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.14) 50%,
    rgba(255, 255, 255, 0.06) 100%
  );
  background-size: 200% 100%;
  animation: fplShimmer 1.6s ease-in-out infinite;
}

.skeletonAvatar {
  composes: skeletonBase;
  width: 4rem;
  height: 4rem;
  border-radius: var(--fpl-radius-pill);
  align-self: center;
}

.skeletonBar {
  composes: skeletonBase;
  height: 1rem;
  width: 9rem;
  align-self: center;
}

.skeletonBarShort {
  composes: skeletonBase;
  height: 0.75rem;
  width: 6rem;
  align-self: center;
}

.skeletonStat {
  composes: skeletonBase;
  border-radius: var(--fpl-radius-md);
  height: 3.5rem;
}

.skeletonNavBar {
  composes: skeletonBase;
  height: 2.25rem;
  border-radius: var(--fpl-radius-pill);
  width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .skeletonBase,
  .skeletonAvatar,
  .skeletonBar,
  .skeletonBarShort,
  .skeletonStat,
  .skeletonNavBar {
    animation: none;
    background-image: none;
  }
}
```

- [ ] **Step 2: Run the app to sanity-check CSS compiles**

```bash
cd web && npx tsc --noEmit
```

Expected: no errors.

---

### Task 2: Add TeamInfoPanelSkeleton component

**Files:**
- Modify: `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx`

- [ ] **Step 1: Write a failing test for the skeleton**

Add to `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.test.tsx`:

```tsx
import { TeamInfoPanelSkeleton } from './TeamInfoPanel';

// ...existing describe block stays...

describe('TeamInfoPanelSkeleton', () => {
  it('renders with aria-busy and aria-label', () => {
    render(<MemoryRouter><TeamInfoPanelSkeleton /></MemoryRouter>);
    const el = screen.getByRole('complementary');
    expect(el).toHaveAttribute('aria-busy', 'true');
    expect(el).toHaveAttribute('aria-label', 'Loading...');
  });
});
```

- [ ] **Step 2: Run the failing test**

```bash
cd web && npx vitest run src/components/ui/TeamInfoPanel/TeamInfoPanel.test.tsx
```

Expected: FAIL — `TeamInfoPanelSkeleton` is not exported.

- [ ] **Step 3: Implement TeamInfoPanelSkeleton**

Add this export at the bottom of `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx`, before `TeamInfoPanel.displayName`:

```tsx
export const TeamInfoPanelSkeleton: React.FC = () => (
  <aside
    className={styles.panel}
    aria-busy="true"
    aria-label={copy.loadingPlaceholder}
  >
    <div className={styles.avatarWrap} aria-hidden="true">
      <div className={styles.skeletonAvatar} />
    </div>

    <div className={styles.identity} aria-hidden="true">
      <div className={styles.skeletonBar} />
      <div className={styles.skeletonBarShort} />
    </div>

    <div className={styles.stats} aria-hidden="true">
      <div className={styles.skeletonStat} />
      <div className={styles.skeletonStat} />
      <div className={styles.skeletonStat} />
      <div className={styles.skeletonStat} />
    </div>

    <div className={styles.navLinks} aria-hidden="true">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className={styles.skeletonNavBar} />
      ))}
    </div>
  </aside>
);

TeamInfoPanelSkeleton.displayName = 'TeamInfoPanelSkeleton';
```

- [ ] **Step 4: Run the test — expect PASS**

```bash
cd web && npx vitest run src/components/ui/TeamInfoPanel/TeamInfoPanel.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx \
        web/src/components/ui/TeamInfoPanel/TeamInfoPanel.module.css \
        web/src/components/ui/TeamInfoPanel/TeamInfoPanel.test.tsx
git commit -m "feat: add TeamInfoPanelSkeleton shimmer component"
```

---

### Task 3: Integrate skeleton into SquadScreen

**Files:**
- Modify: `web/src/screens/SquadScreen/SquadScreen.tsx`

- [ ] **Step 1: Import TeamInfoPanelSkeleton**

In `web/src/screens/SquadScreen/SquadScreen.tsx`, update the existing `TeamInfoPanel` import line:

```tsx
import { TeamInfoPanel, TeamInfoPanelSkeleton } from '@/components/ui/TeamInfoPanel/TeamInfoPanel';
```

- [ ] **Step 2: Replace the conditional render in the Drawer**

Find this block (around line 166):

```tsx
{entry && <TeamInfoPanel entry={entry} teamId={teamId} showFollow={isGuestMode} />}
```

Replace with:

```tsx
{entry
  ? <TeamInfoPanel entry={entry} teamId={teamId} showFollow={isGuestMode} />
  : !entryIsError && <TeamInfoPanelSkeleton />}
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run the full test suite**

```bash
cd web && npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/screens/SquadScreen/SquadScreen.tsx
git commit -m "feat: show TeamInfoPanelSkeleton in Drawer while entry loads"
```
