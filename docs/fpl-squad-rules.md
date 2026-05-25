# FPL Squad Composition Rules

Reference for the Transfer Planner and any future feature that validates squad state.
Season 2025/26. Source: official FPL rules page + community-verified data.

## Squad (15 players)

| Position | Count | Code |
|----------|-------|------|
| Goalkeeper | 2 | GK (`element_type` 1) |
| Defender | 5 | DEF (`element_type` 2) |
| Midfielder | 5 | MID (`element_type` 3) |
| Forward | 3 | FWD (`element_type` 4) |

- **Budget**: £100.0m total at squad assembly.
- **Club limit**: maximum 3 players from any single Premier League club.

## Starting XI (11 from 15)

Exactly 1 GK. Outfield 10 must satisfy all of:

| Position | Minimum | Maximum |
|----------|---------|---------|
| GK | 1 | 1 |
| DEF | 3 | 5 |
| MID | 2 | 5 |
| FWD | 1 | 3 |

Valid formations: 3-4-3, 3-5-2, 4-3-3, 4-4-2, 4-5-1, 5-2-3, 5-3-2, 5-4-1.

Bench: 4 players (1 GK + 3 outfield), priority-ordered for auto-substitutions.

## Transfers

- **Free transfers**: 1 per gameweek, rollover up to **5** (new in 2025/26; was 2 before).
- **Extra transfer cost**: −4 points each beyond the free allowance.
- **Gameweek 16 exception**: free transfers topped up to 5 for AFCON, no deduction.
- Transfers must be confirmed before the gameweek deadline (90 min before first match).

## Chips (2025/26 — double set)

Each chip can be used once per half of the season. First set expires at GW19 deadline.

| Chip | Effect |
|------|--------|
| **Wildcard** | Unlimited free transfers, changes permanent. 2× per season (1 per half). |
| **Free Hit** | Unlimited free transfers for one GW; squad reverts automatically after. 2× per season. |
| **Bench Boost** | All 15 players score points for one GW. 2× per season. |
| **Triple Captain** | Captain earns 3× points instead of 2×. 2× per season. |

Wildcard and Free Hit remove the transfer count constraint and the −4 pts penalty for that GW.

## Scoring (key points, not exhaustive)

- Playing ≥ 1 min: +1 pt (GK/DEF), +1 pt (MID/FWD)
- Playing ≥ 60 min: +2 pts (all positions)
- Goal: GK/DEF +6, MID +5, FWD +4
- Assist: +3
- Clean sheet (≥ 60 min): GK/DEF +4, MID +1
- Captain: 2× points; vice-captain subs if captain plays 0 min
- Yellow card: −1; Red card: −3; Own goal: −2; Penalty miss: −2

## Budget mechanics in the Transfer Planner

The planner operates without the private FPL API, so some values are approximated:

- **Bank** (`entry_history.bank` from picks endpoint, in units of 0.1m): cash balance.
- **Available for a swap** = Bank + selling price of the outgoing player.
- **Selling price approximation**: we use `now_cost` (current market price) for both incoming
  and outgoing players. The real FPL applies a half-profit rule (if price rose since purchase,
  you only recover half the gain). We cannot compute the exact selling price without knowing
  the purchase price (private). A disclaimer is shown in the UI.
- **New bank after swap** = Bank + OUT `now_cost` − IN `now_cost`.

## Fixture Difficulty Rating (FDR)

FPL publishes a difficulty rating per fixture per team. The value is stored in the fixtures
endpoint as `team_h_difficulty` / `team_a_difficulty` (integer 1–5, rarely 1 in practice).

Color scale used in this project (mapped from FPL's own official palette):

| Level | Meaning | Background | Text |
|-------|---------|------------|------|
| 1 | Very easy | `#375523` | `#b8e88a` |
| 2 | Easy | `#00FF87` | `#002210` |
| 3 | Medium | `#E8C347` | `#2a1e00` |
| 4 | Hard | `#E8604C` | `#ffffff` |
| 5 | Very hard | `#730C18` | `#ffb8b8` |

Source: FPL official fixture table CSS (2–6 scale mapped to 1–5).
FPL's original level 4 is grey; we replace it with amber for legibility on dark backgrounds.
