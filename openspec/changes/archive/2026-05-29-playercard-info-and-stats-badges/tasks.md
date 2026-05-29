# Tasks: PlayerCard Info Popup and Stats Badges

## Task 1: PlayerCard — goals/assists badges (VIS-01)

**Files:**
- Modify: `web/src/components/ui/PlayerCard/PlayerCard.tsx`
- Modify: `web/src/components/ui/PlayerCard/PlayerCard.module.css`
- Modify: `web/src/components/ui/PlayerCard/PlayerCard.test.tsx`

- [x] Add `.goalBadge` and `.assistBadge` styles to `PlayerCard.module.css` — small pill,
      `var(--fpl-fs-micro)` font, bold, absolute bottom-left, stacked horizontally.
      Goals: green bg. Assists: teal/blue bg. Only rendered when `size === 'large'`.
- [x] In `PlayerCard.tsx`, render goal badge when `size === 'large' && player.stats.goals_scored > 0`.
- [x] Render assist badge when `size === 'large' && player.stats.assists > 0`.
- [x] Add tests: badges render when goals > 0 / assists > 0; hidden when 0; hidden on medium size.

## Task 2: PlayerCard — ⓘ button and info popup (UX-04)

**Files:**
- Modify: `web/src/components/ui/PlayerCard/PlayerCard.tsx`
- Modify: `web/src/components/ui/PlayerCard/PlayerCard.module.css`
- Modify: `web/src/lib/copy.ts`

- [x] Add `playerInfo?: { ownership: string; currentPrice: number; nextFixtures: FixtureInfo[] }`
      to `PlayerCardProps`.
- [x] Add copy keys: `playerInfoClose`, `playerInfoOwnership`, `playerInfoPrice`,
      `playerInfoUpcomingFixtures`.
- [x] Render `ⓘ` button (top-right, absolute) only when `playerInfo` is provided.
      `onClick` sets `showInfo = true` and calls `e.stopPropagation()`.
- [x] Render popup as a `<dialog>` or fixed overlay when `showInfo` is true:
      - Header: name, `£{currentPrice/10}m`, `{ownership}%`, `{position} / {club}` + close button
      - Fixture rows: `GW{gw}  {opponent} ({H/A})  <FdrChip />`
      - Dismiss on close button, Escape key, click outside
- [x] Add tests: ⓘ button absent without `playerInfo`; popup opens on click; closes on Escape
      and backdrop click; fixture rows rendered; no popup without playerInfo prop.

## Task 3: Wire playerInfo in TransferPitch

**Files:**
- Modify: `web/src/screens/TransferScreen/TransferPitch.tsx`

- [x] In `TransferPitch`, derive `playerInfo` from `poolLookup?.get(player.id)` for each
      starter card: `{ ownership: p.selectedByPercent, currentPrice: p.nowCost, nextFixtures: p.nextFixtures }`.
- [x] Pass `playerInfo` to `<PlayerCard>` for starters only (not bench — medium size).
- [x] Verify TypeScript passes: `cd web && npx tsc --noEmit`.

## Task 4: Wire playerInfo in SquadScreen

**Files:**
- Modify: `web/src/screens/SquadScreen/SquadScreen.tsx`

- [x] Move `usePlayerPool()` call outside the `isNextGw` guard so it always runs.
- [x] Build `poolLookup` unconditionally (not only when `isNextGw`).
- [x] Pass `playerInfo` to starter `<PlayerCard>`s:
      `playerInfo={poolLookup?.get(player.id) ? { ownership: ..., currentPrice: ..., nextFixtures: ... } : undefined}`.
- [x] Keep `nextFixture` (single fixture row below name) wired only on `isNextGw` as before.
- [x] Run all tests: `cd web && npx vitest run --reporter=verbose 2>&1 | tail -20`.
