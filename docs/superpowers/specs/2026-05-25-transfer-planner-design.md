# Transfer Planner — Design Spec

**Date**: 2026-05-25  
**Status**: Approved  
**Scope**: Single-gameweek local transfer planner (no private FPL API)

---

## Goal

Let users plan their FPL transfers for the next gameweek without leaving the app. The planner
shows the current squad (from the last completed GW), lets the user swap players in/out,
enforces budget and squad composition rules, and persists the draft locally. No actual
transfers are submitted to FPL — this is a planning tool.

---

## Navigation

A dedicated `/transfers` screen, accessible from the main navbar alongside Squad and Stats.
URL: `/?teamId={id}&screen=transfers` (consistent with existing URL-as-source-of-truth pattern).

---

## Data sources

### Existing proxy endpoints used
- `/api/entry/:teamId` — team summary (bank from `entry_history` of last GW picks)
- `/api/squad/:teamId/:gw` — last completed GW squad (15 players with position, captain, bench order)

### New proxy endpoint required
- **`GET /api/fixtures/upcoming`** — returns next 3 gameweeks of fixtures for all 20 clubs.
  Response shape: `Record<teamId, FixtureInfo[]>` where each `FixtureInfo` has
  `{ gw, opponent: string, home: boolean, difficulty: 1|2|3|4|5 }`.
  Source: FPL `GET /fixtures/?event={gw}` called 3 times (current+1, +2, +3), merged.

### New proxy endpoint required
- **`GET /api/player-pool`** — all players available for transfer.
  Returns players from `bootstrap-static` `elements[]` enriched with:
  - `next_fixtures: FixtureInfo[]` (3 fixtures, from the upcoming endpoint above)
  - fields: `id`, `web_name`, `first_name`, `second_name`, `team`, `team_code`,
    `element_type`, `now_cost`, `total_points`, `event_points`, `status`,
    `chance_of_playing_this_round`, `news`, `selected_by_percent`, `form`

---

## Screen layout

```
┌─────────────────────────────────────┐
│  Transfers          [🃏 WC] [⚡ FH] │  ← Header
│  Bank £4.2m  │ 2 free  │ 0 pts cost │  ← Stats bar
├─────────────────────────────────────┤
│                                     │
│         [Pitch — 15 players]        │  ← PitchPlayer components with jerseys
│     OUT players: red pulsing ring   │      (same as SquadScreen)
│      IN players: green ring + badge │
│                                     │
├─────────────────────────────────────┤
│  Planned transfers (0)              │  ← Swaps strip (always visible)
│  "Tap a player to start planning"   │
├─────────────────────────────────────┤
│  [Reset]           [Save Plan ▶]    │  ← Action bar
└─────────────────────────────────────┘
```

When the user taps a player, a **bottom sheet** slides up over the pitch (pitch dims to ~50%
opacity). The sheet closes when the user selects a replacement or taps outside.

---

## Pitch view

Reuses the existing `PitchPlayer` component (with kit jersey images, availability badge,
captain/VC badge). The Transfer Screen passes additional props:

- `variant="out"` — red pulsing ring, `OUT` badge top-right
- `variant="in"` — green ring, `IN` badge top-right
- `variant="default"` — normal state (tappable)

Bench players are shown below a dashed divider, same as SquadScreen.

---

## Bottom sheet — player picker

Opens when any squad player is tapped.

**Header**:
- Title: "Replace {player name}"
- Subtitle: "{Position} · selling for £{now_cost}m"
- Search input (filters by `web_name` / `first_name` / `second_name`)
- Sort pills: Pts ↓ · Price ↓ · Form ↓ · GW pts ↓ · Sel% ↓ (default: Pts ↓)

**Player list columns**:
1. Mini jersey (club colour) + player name + availability dot + club · stat
2. Next 3 fixtures — 3 FDR chips (team abbrev + H/A, colored by difficulty)
3. Price — green if affordable, red + row dimmed if over budget

**Filtering applied automatically**:
- Position matches the OUT player's `element_type`
- Players already in the squad are hidden
- Budget constraint: `available = bank + now_cost(OUT)`. Players with `now_cost > available`
  are shown but dimmed (opacity 0.28) and non-interactive
- Club constraint: if adding this player would exceed 3 from their club, they are shown
  dimmed with a "3 already" tooltip

**FDR chip colors** (see `docs/fpl-squad-rules.md` for hex values):
`1` dark forest green · `2` FPL neon green · `3` amber · `4` salmon-orange · `5` dark crimson

---

## Swaps strip

Always visible between the pitch and the action bar. Shows all planned swaps as rows:

```
Planned transfers · N of M free used
[Semenyo] → [Salah]   +£3.9m   [✕]
[Haaland] → [Wissa]   −£7.6m   [✕]
```

- Each row has an undo button (✕) that removes the swap and restores the original player
- Delta = `now_cost(IN) − now_cost(OUT)` (positive = spent more, shown as +£X.Xm)
- When empty: shows "Tap a player to start planning" in muted italic text
- Transfer count label changes colour: green (within free limit) → amber (at limit) → red (over)

---

## Stats bar

Three metrics, always in sync with the current draft state:

| Metric | Source |
|--------|--------|
| **Bank** | Starts from `entry_history.bank`; updated on each swap: `bank += out.now_cost − in.now_cost` |
| **Free transfers** | User-editable (tap to change, 1–5). Cannot be read from public API. Default: 1. Persisted in localStorage alongside the draft. |
| **Cost** | `max(0, swaps.length − freeTransfers) × 4` pts. Neutral colour when 0; amber when 1 extra xfr; red when ≥ 2 extra (≥ 8 pts lost). |

---

## Chip modes

Two chip buttons in the header: **Wildcard** and **Free Hit**.
Tapping activates the chip (button turns green). Only one chip can be active at a time.
Tapping again deactivates.

When a chip is active:
- Transfer count constraint is removed (no −4 pts)
- Stats bar shows "Wildcard active" / "Free Hit active" instead of the cost metric
- Free Hit: a note is shown — "Squad reverts after GW{n}"

Whether the user has actually played their chip cannot be determined from the public API;
the planner trusts the user's selection.

---

## Persistence (localStorage)

Key: `fpl-transfer-draft-{teamId}`

```typescript
interface TransferDraft {
  teamId: number;
  targetGw: number;        // next gameweek id
  savedAt: string;         // ISO timestamp
  freeTransfers: number;   // 1–5, user-entered
  chip: 'none' | 'wildcard' | 'freehit';
  swaps: Array<{
    outId: number;         // element id of outgoing player
    inId: number;          // element id of incoming player
  }>;
}
```

Draft is auto-saved on every change (debounced 300ms).
On load: if a saved draft exists for this teamId, it is restored. If the target GW no longer
matches the current next GW (e.g. a new GW started), the draft is discarded with a toast:
"Your saved plan was for GW{n} which has passed. Starting fresh."

---

## Budget disclaimer

A small note below the stats bar (or in a tooltip on Bank):

> "Selling prices are approximate. The actual price may differ if a player's value changed
> since you bought them."

---

## Constraints enforced

| Constraint | Enforcement |
|------------|-------------|
| Budget | Over-budget players dimmed in picker |
| Club limit (max 3) | Over-limit club players dimmed in picker |
| Position | Picker only shows players of the same position |
| No duplicates | Players already in squad hidden from picker |
| Squad composition | Validated on pitch; warn if an invalid formation results (edge case for bench swaps — out of scope for now) |

---

## Error and loading states

- **Loading**: skeleton for the pitch and a spinner for the player picker list
- **API error**: full-screen error with retry button (same pattern as SquadScreen)
- **No picks available** (new team, no GW played yet): empty state with message "No squad found — play at least one gameweek to use the transfer planner"

---

## Components

| Component | Description |
|-----------|-------------|
| `TransferScreen` | Screen root: data fetching, draft state, routing |
| `TransferHeader` | Stats bar + chip buttons |
| `TransferPitch` | Pitch layout, delegates to `PitchPlayer` (reused) |
| `PlayerPickerSheet` | Bottom sheet with search/sort/list |
| `PlayerPickerRow` | Single player row with FDR chips |
| `FdrChip` | Single fixture chip (team abbr + H/A, coloured) |
| `SwapsStrip` | Pending swaps list with undo buttons |
| `TransferActionBar` | Reset + Save Plan buttons |

---

## New proxy endpoints — summary

| Endpoint | FPL source | Cache |
|----------|-----------|-------|
| `GET /api/fixtures/upcoming` | `GET /fixtures/?event={gw}` × 3 | 1 hour (fixtures don't change intra-GW) |
| `GET /api/player-pool` | `bootstrap-static` + upcoming fixtures | 10 min (prices can change) |

---

## Out of scope (this iteration)

- Multi-gameweek planning (architecture ready: `targetGw` field in draft schema)
- Actual transfer submission to FPL
- Bench order changes / captain selection in planner
- Fixture difficulty for bench swap validation
- Triple Captain / Bench Boost chip selection
