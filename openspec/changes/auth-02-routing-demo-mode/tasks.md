# Tasks: Routing Overhaul & Demo Mode (AUTH-02)

## Step 1 — Refactor MyTeamContext and MyTeamProvider

Outcome: `MyTeamContext` exposes `isDemoMode`, `myTeamId` is sourced from backend or
sessionStorage (localStorage removed), and `setDemoTeamId` / `clearDemoMode` APIs are in
place.

- [x] `web/src/lib/my-team/MyTeamContext.ts`: add `isDemoMode: boolean`,
      `setDemoTeamId: (id: number | null) => void`, `clearDemoMode: () => void` to context
      type. Remove any localStorage types.
- [x] `web/src/lib/my-team/MyTeamProvider.tsx`:
  - Read initial demo state from `sessionStorage` (`fpl-demo-team-id`, `fpl-is-demo-mode`).
  - Derive `myTeamId`: `isDemoMode ? demoTeamId : (user?.fplTeamId ?? null)`.
  - `setDemoTeamId(id)`: writes to sessionStorage, sets `isDemoMode = true`.
  - `clearDemoMode()`: clears sessionStorage keys, resets demo state.
  - `setMyTeamId(id)`: for authenticated users — calls `authClient.saveTeam(id)` then
    `refetch()`. Remove localStorage write.
- [x] `web/src/lib/my-team/MyTeamProvider.tsx`: call `clearDemoMode()` is exported and
      usable by `SignInScreen`/`SignUpScreen` after successful auth.
- [x] Update `web/src/lib/my-team/MyTeamContext.test.ts` (or provider test) to cover
      sessionStorage-backed demo state, `clearDemoMode`, and backend-sourced `myTeamId`.

---

## Step 2 — Routing overhaul in App.tsx

Outcome: default route redirects unauthenticated non-demo users to `/sign-in`; demo mode
and authenticated states route correctly; `MyTeamProtectedRoute` is replaced by
`AuthAndTeamProtectedRoute`.

- [x] `web/src/App.tsx`: implement the routing state machine in `rootElement()`:
  - `loading` (auth bootstrap) → render `null` (no flash).
  - `!user && !isDemoMode` → `<Navigate to="/sign-in" replace />`.
  - `isDemoMode && !myTeamId` → `<Navigate to="/entry" state={{ demo: true }} replace />`.
  - `isDemoMode && myTeamId` → `<SquadScreen teamId={myTeamId} navLinksMode="demo" />`.
  - `user && !user.fplTeamId` → `<EntryScreen />` (gate, no navigate — render inline).
  - `user && user.fplTeamId` → `<SquadScreen teamId={user.fplTeamId} navLinksMode="full" />`.
- [x] `web/src/App.tsx`: replace `MyTeamProtectedRoute` with `AuthAndTeamProtectedRoute`
      that checks `user && user.fplTeamId`; redirects to `/sign-in` if no user, to `/entry`
      if user but no `fplTeamId`.
- [x] `web/src/App.tsx`: add explicit `/entry` route rendering `EntryScreen`.
- [x] `web/src/App.tsx`: remove `MyTeamProtectedRoute` function.
- [ ] Update `web/src/App.test.tsx` (or integration test) to cover each routing state.

---

## Step 3 — EntryScreen: demo mode support

Outcome: `EntryScreen` detects demo context from `location.state.demo` and calls
`setDemoTeamId` instead of the backend path.

- [x] `web/src/screens/EntryScreen/EntryScreen.tsx`:
  - Read `isDemo` from `location.state`.
  - On submit in demo mode: call `setDemoTeamId(id)` (from `useMyTeam()`), then
    `navigate('/', { replace: true })`.
  - On submit when authenticated (existing path): `authClient.saveTeam(id)` +
    `onSubmit?.(id)` unchanged.
- [x] `web/src/screens/EntryScreen/EntryScreen.test.tsx`: add tests for demo mode submit
      path (mocks `setDemoTeamId`, verifies no backend call).

---

## Step 4 — SignInScreen: "Try Demo" button + clearDemoMode on auth

Outcome: the sign-in screen has a visible "Try Demo" path and clears demo state on
successful authentication.

- [x] `web/src/screens/SignInScreen/SignInScreen.tsx`:
  - Add "Try Demo" button (below Google OAuth button).
  - On click: `navigate('/entry', { state: { demo: true } })`.
  - On successful sign-in: call `clearDemoMode()` before navigating away.
- [x] `web/src/screens/SignInScreen/SignInScreen.module.css`: style "Try Demo" as a
      tertiary/ghost button visually distinct from "Sign in with Google".
- [x] `web/src/screens/SignUpScreen/SignUpScreen.tsx`: call `clearDemoMode()` on successful
      sign-up.
- [x] `web/src/lib/copy.ts`: add `signInTryDemo` copy key.
- [x] `web/src/screens/SignInScreen/SignInScreen.test.tsx`: test "Try Demo" navigation.

---

## Step 5 — TeamInfoPanel: navLinksMode prop

Outcome: `TeamInfoPanel` supports `navLinksMode: 'full' | 'hidden' | 'demo'`; in demo
mode nav links are rendered but redirect to `/sign-in`.

- [x] `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx`:
  - Replace `showNavLinks: boolean` with `navLinksMode: 'full' | 'hidden' | 'demo'`
    (keep `showNavLinks` as deprecated alias mapping to `'full'`/`'hidden'` for
    backwards compat during transition, or update all call sites directly).
  - `'full'`: existing `<Link>` elements.
  - `'hidden'`: nothing rendered.
  - `'demo'`: render links as `<button>` with `onClick={() => navigate('/sign-in')}`.
    Add a visual indicator (e.g., lock icon or muted style) so the user understands why
    tapping leads to sign-in.
- [x] `web/src/screens/SquadScreen/SquadScreen.tsx`: pass `navLinksMode` derived from
      `isDemoMode` and `isGuestMode`:
  - `isDemoMode` → `"demo"`
  - `isGuestMode` → `"hidden"`
  - otherwise → `"full"`
- [x] `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.test.tsx`: test all three modes
      — full renders links, hidden renders nothing, demo renders buttons that navigate.

---

## Step 6 — Verification and cleanup

- [x] Run `npm run test -w web` — all tests pass.
- [x] Run `npm run typecheck -w web` — no type errors.
- [x] Run `npm run lint -w web` — no lint errors.
- [ ] Manual smoke test (dev server):
  - Unauthenticated → `/` redirects to `/sign-in`.
  - "Try Demo" → `EntryScreen` → team ID → `SquadScreen` (demo mode).
  - Demo `SquadScreen` drawer: nav links visible, clicking any → `/sign-in`.
  - Demo "Change" → `EntryScreen` with demo flag, new team ID works.
  - Sign in → no `fplTeamId` → `EntryScreen` gate shown, URL manipulation blocked.
  - Sign in with `fplTeamId` → `SquadScreen` (full mode), all nav links work.
- [ ] Archive this OpenSpec change via `openspec-archive-change` once all steps pass.
