# Proposal: Routing Overhaul & Demo Mode (AUTH-02)

## Problem

With AUTH-01 landing user accounts, the current routing model no longer fits. Today `/`
either shows `EntryScreen` (no team ID) or `SquadScreen` — with no concept of
authentication state. Anonymous users can reach all screens and the only gate is a local
team ID in `localStorage`. This creates several issues:

- An unauthenticated visitor landing on `/` sees the team ID entry form with no context
  about what the product is and no prompt to sign in or try it.
- There is no "try before you sign up" path — users are forced to either sign in or enter
  a team ID with no persistence promise.
- `localStorage` is the sole source of truth for `teamId`; authenticated users with a
  saved `fplTeamId` on the backend don't benefit from it automatically.
- Screen gates (`MyTeamProtectedRoute`) only check for a local `teamId`, not for auth.
  Routes that require a real account (e.g., future watchlist sync) have no clean gating.

## Solution

**AUTH-02** introduces a two-level routing model and a Demo mode, with `localStorage`
removed as a teamId source.

### Default route → sign-in

`/` and all protected routes redirect unauthenticated, non-demo users to `/sign-in`.
`SignInScreen` gains a **"Try Demo"** button — the primary call-to-action for new visitors
who want to see the app without registering.

### Demo mode

Clicking "Try Demo" navigates to `EntryScreen` with `location.state.demo = true`. The
user enters any FPL team ID (validated against the API); the ID is stored in
`sessionStorage` (survives page refresh, gone when tab closes). The app then renders
`SquadScreen` in demo mode.

In demo mode:
- `SquadScreen` is fully accessible (squad, gameweek navigation, pitch/list view).
- The drawer opens and all nav links are visible, but every link click redirects to
  `/sign-in` (demo mode users cannot navigate to other screens).
- The **Change** button on `SquadScreen` works: clicking it returns to `EntryScreen` with
  `demo = true`, letting the user view a different team.
- No data is persisted to the backend. On sign-in, the demo teamId is discarded.

### Authenticated routing gate

After sign-in or sign-up, if `user.fplTeamId` is `null`, the user is gated on
`EntryScreen` — no URL manipulation can bypass this. Once a team ID is submitted
(`PUT /api/me/team` succeeds), the user gains full access to all screens.

### teamId source of truth

| User state | teamId source |
|---|---|
| Unauthenticated (no demo) | none — redirect to `/sign-in` |
| Demo mode | `sessionStorage` |
| Authenticated, no `fplTeamId` | none — gate on `EntryScreen` |
| Authenticated, has `fplTeamId` | `user.fplTeamId` from `AuthContext` |

`localStorage` is removed entirely as a teamId source.

## User value

- "I want to see the app before creating an account" — Demo mode delivers this with a
  single tap.
- "I signed in and my team is already there" — `fplTeamId` from the backend pre-fills and
  takes the user straight to SquadScreen.
- "I clicked a deep link while logged out" — they land on sign-in, then return to where
  they intended after signing in.

## Scope

### In

- `web/src/App.tsx`: routing overhaul — default redirect to `/sign-in`, demo mode routing,
  authenticated team-ID gate.
- `web/src/lib/my-team/`: refactor `MyTeamProvider` and `MyTeamContext` — remove
  localStorage, add `isDemoMode` flag, source teamId from backend or sessionStorage.
- `web/src/screens/SignInScreen/SignInScreen.tsx`: add "Try Demo" button.
- `web/src/screens/EntryScreen/EntryScreen.tsx`: detect `location.state.demo`; in demo
  mode save to sessionStorage instead of backend.
- `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx`: add `navLinksMode` prop
  (`'full' | 'hidden' | 'demo'`); in `'demo'` mode nav links are visible but redirect to
  `/sign-in`.
- `web/src/screens/SquadScreen/SquadScreen.tsx`: pass correct `navLinksMode` based on auth
  and demo state.
- Tests updated for all modified components.

### Out

- Email verification (AUTH-03).
- Backend changes — no new proxy endpoints needed.
- `watchlist`, `player-watchlist` auth gates already in place via `ProtectedRoute`;
  behaviour unchanged.
