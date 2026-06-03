# Design: Routing Overhaul & Demo Mode (AUTH-02)

## Current implementation

- `web/src/App.tsx` — `AppContent` reads `myTeamId` from `MyTeamContext` (localStorage) and
  `viewedTeamId` from a `?teamId=` search param. Root renders `EntryScreen` (no teamId),
  `SquadScreen` (teamId set), or guest `SquadScreen` (URL param). No auth gate on `/`.
- `web/src/lib/my-team/MyTeamProvider.tsx` — stores `teamId` in `localStorage`. Source of
  truth for the current team ID. No concept of demo mode or auth state.
- `web/src/auth/AuthProvider.tsx` + `AuthContext.ts` — bootstraps `user` from `GET /api/me`
  on mount. `user.fplTeamId` available but not driving routing.
- `web/src/auth/ProtectedRoute.tsx` — redirects unauthenticated users to `/sign-in` with
  `returnTo` state. Used only for `/watchlist` and `/player-watchlist`.
- `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx` — `showNavLinks` boolean controls
  whether nav links render. No demo-mode variant.
- `web/src/screens/SquadScreen/SquadScreen.tsx` — passes `showNavLinks={!isGuestMode}` to
  `TeamInfoPanel`.

## Key decisions

1. **Demo teamId in `sessionStorage`, not `localStorage`.** sessionStorage survives page
   refresh (important for mobile where background tabs get discarded) but is automatically
   cleared when the tab closes. This matches the intent of "temporary" — no persistent
   footprint and no manual cleanup.

2. **`isDemoMode` lives in `MyTeamContext`, not `AuthContext`.** Demo mode is about how
   the *team ID* is sourced, not about the user's identity. `AuthContext` already provides
   `user`/`loading`; coupling demo state to it would conflate two orthogonal concerns.

3. **`navLinksMode: 'full' | 'hidden' | 'demo'` replaces `showNavLinks: boolean`.**
   The boolean is a subset — `showNavLinks=false` maps to `'hidden'`. The third state
   `'demo'` renders links visually but wraps them in a `<button>` that navigates to
   `/sign-in`, making them tappable and discoverable while enforcing the auth gate.

4. **Auth + team-ID gate in `App.tsx`, not inside each screen.** Centralising the gate
   logic in one place keeps individual screens dumb. Screens receive the data they need as
   props; they never need to check auth state themselves.

5. **`setMyTeamId` unified API.** For demo mode it writes to sessionStorage; for
   authenticated users it calls `PUT /api/me/team` and then triggers `refetch()` on
   `AuthContext`. Callers (EntryScreen, SquadScreen) don't need to know which path is taken.

## Component and data-flow map

```
App
└── AuthProvider                  (user, loading, refetch)
    └── MyTeamProvider            (teamId, isDemoMode, setMyTeamId)
        └── AppContent
            ├── rootElement()
            │   ├── loading       → null (spinner)
            │   ├── !user && !isDemoMode → <Navigate to="/sign-in" />
            │   ├── isDemoMode && !demoTeamId → <Navigate to="/entry" state={demo} />
            │   ├── isDemoMode && demoTeamId → <SquadScreen navLinksMode="demo" />
            │   ├── user && !fplTeamId → <EntryScreen /> (gate)
            │   └── user && fplTeamId → <SquadScreen navLinksMode="full" />
            │
            ├── /sign-in          → SignInScreen (+ Try Demo button)
            ├── /entry            → EntryScreen (reads location.state.demo)
            ├── /history …        → AuthAndTeamProtectedRoute
            └── /watchlist …      → ProtectedRoute (auth only, unchanged)
```

## File-level changes

### `web/src/lib/my-team/MyTeamContext.ts`

Add `isDemoMode: boolean` to context type. Remove any localStorage reference.

```ts
interface MyTeamContextValue {
  myTeamId: number | null;
  isDemoMode: boolean;
  setMyTeamId: (id: number | null) => void;
}
```

### `web/src/lib/my-team/MyTeamProvider.tsx`

```
State:
  demoTeamId: number | null  — initialised from sessionStorage('demo-team-id') | null
  isDemoMode: boolean        — initialised from sessionStorage('is-demo-mode') === 'true'

Derived:
  myTeamId = isDemoMode
    ? demoTeamId
    : (user?.fplTeamId ?? null)

setMyTeamId(id):
  if isDemoMode OR (!user):
    → write to sessionStorage, update demoTeamId state
    → also set isDemoMode = true in sessionStorage if id !== null
  else:
    → call authClient.saveTeam(id) → refetch() to update user.fplTeamId
```

Add `enterDemoMode()` / `exitDemoMode()` — called by `EntryScreen` and post-sign-in flow.
Actually: demo mode is entered implicitly when `setMyTeamId` is called while
`location.state.demo = true`. `EntryScreen` signals this via a prop/state flag.

Simpler: `MyTeamProvider` exposes `setDemoTeamId(id: number | null)` (sets demo state) and
`clearDemoMode()` (clears sessionStorage + state). `setMyTeamId` remains for authenticated
users (calls backend).

### `web/src/App.tsx`

- Remove `MyTeamProtectedRoute` (replaced by unified gate in `rootElement`).
- Add `AuthAndTeamProtectedRoute`: checks `user && user.fplTeamId` — if not, redirects to
  the appropriate gate (`/sign-in` or `/entry`).
- Route `/entry` added explicitly (currently `EntryScreen` is embedded in root).
- Root route `rootElement()` implements the state machine from the map above.

### `web/src/screens/SignInScreen/SignInScreen.tsx`

Add "Try Demo" button below the Google OAuth button. On click:
```ts
navigate('/entry', { state: { demo: true } });
```

### `web/src/screens/EntryScreen/EntryScreen.tsx`

Read `const isDemo = (location.state as { demo?: boolean })?.demo ?? false`.

On submit:
- `isDemo`: call `setDemoTeamId(id)`, navigate to `/`.
- Authenticated: existing path (`authClient.saveTeam` + `onSubmit`), navigate to `/`.

### `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx`

Replace `showNavLinks: boolean` with `navLinksMode: 'full' | 'hidden' | 'demo'`.

- `'full'`: existing nav links with `<Link>`.
- `'hidden'`: no nav links rendered.
- `'demo'`: nav links rendered as `<button>` elements that call `navigate('/sign-in')`.

### `web/src/screens/SquadScreen/SquadScreen.tsx`

Replace `showNavLinks` prop threading with `navLinksMode`:
- Not guest, authenticated: `navLinksMode="full"`
- Demo mode: `navLinksMode="demo"`
- Guest (viewing another team's squad): `navLinksMode="hidden"`

SquadScreen reads `isDemoMode` from `useMyTeam()` to determine which mode to pass.

## sessionStorage keys

| Key | Value | When set |
|---|---|---|
| `fpl-demo-team-id` | `"<number>"` | On demo team ID submission |
| `fpl-is-demo-mode` | `"true"` | On demo team ID submission |

Both cleared on `clearDemoMode()` — called on sign-in and sign-up success.
