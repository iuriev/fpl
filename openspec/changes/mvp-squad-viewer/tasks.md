## 1. Visual design (before any UI code)

- [x] 1.1 Confirm the design tooling pipeline and access (Claude Design) and record it as an ADR
- [ ] 1.2 Feed the approved UX spec (design.md) to the design step; produce a football-pitch squad prototype + entry screen
- [ ] 1.3 Derive a design system (colors, typography, components) and get visual approval
- [ ] 1.4 Hand off the approved design to implementation

## 2. Project scaffolding

- [ ] 2.1 Decide and create the repo layout: `web/` (Vite SPA) and `proxy/` (Hono), with workspaces
- [ ] 2.2 Initialize the Vite + React + TypeScript app in `web/`
- [ ] 2.3 Initialize the Hono + TypeScript proxy in `proxy/`
- [ ] 2.4 Set up local dev (run web + proxy together), env config, and finalize `.gitignore` (add `dist/`, `.env*`)
- [ ] 2.5 Remove the placeholder `src/index.ts` stub and old single-package config
- [ ] 2.6 Set up ESLint + Prettier (enforced) and Vitest + React Testing Library
- [ ] 2.7 Port design tokens: `tokens.ts` + `colors_and_type.css` (global CSS variables); add one placeholder shirt to `web/public/shirts/` (used for all players in MVP)
- [ ] 2.8 Port the design system into a base component kit (CSS Modules, values via CSS variables) with RTL tests and a Storybook story per component state
- [ ] 2.9 Add self-hosted fonts (Space Grotesk, JetBrains Mono as woff2) to the theme
- [ ] 2.10 Add a centralized UI copy module (English, structured for future i18n)
- [ ] 2.11 Set up Storybook

## 3. Proxy: FPL integration and endpoints

- [ ] 3.1 Implement an FPL client (bootstrap-static, entry, event picks, event live)
- [ ] 3.2 Add a caching layer with the D2 default TTLs (bootstrap 1h, entry 1h, finished GW 24h, current GW 60s)
- [ ] 3.3 Implement `GET /api/gameweeks` returning `{ current, gameweeks[] }`; derive current GW and the off-season fallback (D3)
- [ ] 3.4 Implement `GET /api/entry/:teamId` returning `{ teamId, teamName, managerName }`; map unknown ID to a not-found response
- [ ] 3.5 Implement `GET /api/squad/:teamId/:gw` composing starters/bench with name, position, club, points, captain/vice flags (D1, D4)
- [ ] 3.6 Add error handling for upstream/unreachable and no-picks-for-gameweek cases
- [ ] 3.7 Extend each player in `/api/squad` with availability `status`, `chanceOfPlaying`, and `news`
- [ ] 3.8 Add a `summary` to `/api/squad` (net total points, average, highest, rank, transfers) per D6

## 4. Frontend: data layer

- [ ] 4.1 Add an API client for the proxy endpoints
- [ ] 4.2 Set up React Query for fetching, caching, and loading/error states
- [ ] 4.3 Set up React Router with the team ID and gameweek as URL query parameters
- [ ] 4.4 Create shared `fixtures/` (normal team, empty gameweek, error, flagged player) used by stories

## 5. Frontend: Entry screen (team-entry)

- [ ] 5.1 Build the entry form: numeric team ID input, helper text, primary action
- [ ] 5.2 Validate input: block empty and non-positive-integer values with inline messages
- [ ] 5.3 On submit, validate via `/api/entry`; handle not-found and unreachable states with retry
- [ ] 5.4 Carry the team ID in the URL query param; restore from URL on load (skip to Squad); allow changing the team
- [ ] 5.5 Storybook stories for Entry states (idle, invalid, not-found, submitting)

## 6. Frontend: Squad screen (squad-view)

- [ ] 6.1 Build the football-pitch layout: starting XI in GK/DEF/MID/FWD rows
- [ ] 6.2 Build the bench strip (4 players in FPL order)
- [ ] 6.3 Player token: short name, position, club, gameweek points, and C/V badges
- [ ] 6.4 Loading skeleton, empty state (no squad for gameweek), and error state with retry
- [ ] 6.5 Render the gameweek summary strip (total emphasized; placeholder for missing values)
- [ ] 6.6 Show the availability indicator on flagged players; reveal news + chance of playing on select
- [ ] 6.7 Storybook stories for Squad states (loaded, empty, error, loading) across mobile + desktop

## 7. Frontend: Gameweek navigation (gameweek-navigation)

- [ ] 7.1 Default to the current gameweek (off-season: latest with data)
- [ ] 7.2 Previous/next controls bounded to `1 … current`; disable at the ends
- [ ] 7.3 Show the selected gameweek label in the header

## 8. Verification

- [ ] 8.1 Walk every spec scenario manually using team ID 72828 across multiple gameweeks
- [ ] 8.2 Check mobile and desktop layouts; confirm boundary and empty/error states
- [ ] 8.3 Verify status indicators (find a flagged player) and that summary values match the official app
- [ ] 8.4 qa-tester gate: capture screenshots from Storybook stories (mobile + desktop); verify visual fidelity to the design + state coverage; commit report + screenshots to `qa/`
