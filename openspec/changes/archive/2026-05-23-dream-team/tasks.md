## 1. Proxy: dream-team endpoint

- [x] 1.1 Implement `GET /api/dream-team/:gw` backed by FPL `GET /dream-team/{gw}/`
- [x] 1.2 Merge with `bootstrap-static` `elements[]` to produce per-player shape:
      `{ id, webName, position, teamCode, teamShortName, points, pitchPosition }`
- [x] 1.3 Return `{ gw, players: [...] }` with players in pitch-row order (GK, DEF, MID, FWD)
- [x] 1.4 Cache TTL: 24 h (finished-GW data, immutable)
- [x] 1.5 Return 400 for a GW that has not yet finished
- [x] 1.6 Add proxy unit tests for the dream-team endpoint

## 2. Frontend: DreamTeam screen

- [x] 2.1 Add route `/dream-team?gw=N`
- [x] 2.2 Build the `DreamTeamScreen`: heading "Dream Team", GW label, gameweek navigator
- [x] 2.3 Reuse the `Pitch` component; pass the 11 players without a bench row
- [x] 2.4 Gameweek navigator bounded to finished GWs only; defaults to most recently
      finished GW
- [x] 2.5 Add loading skeleton (reuse `SquadSkeleton` or a variant), error state with retry,
      and "not yet available" state for in-progress GWs
- [x] 2.6 Add RTL unit tests for `DreamTeamScreen`

## 3. Frontend: Navigation

- [x] 3.1 Add a Dream Team entry point in the main navigation

## 4. Verification

- [x] 4.1 Verify the 11 players render correctly on the pitch for a finished GW
- [x] 4.2 Verify the gameweek navigator is bounded to finished GWs
- [x] 4.3 Verify the "not yet available" state for the current in-progress GW
- [x] 4.4 Verify the selected GW persists in the URL
