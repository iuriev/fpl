# Design: v2 Design Implementation

Reference export: `design/exports/v2/`
Full diff report: `design/exports/v2/CHANGES.md`

## Source files

| File | Role |
|---|---|
| `design/exports/v2/list.jsx` | New list-view components (ViewToggle, ListView, PositionBadge, CapInlineBadge, StatusDot, skeletons) |
| `design/exports/v2/screens.jsx` | Authoritative squad + entry screens — dark palette, list/pitch toggle wired |
| `design/exports/v2/pitch.jsx` | Pitch row-order fix (FWD top, GK bottom) |
| `design/exports/v2/tokens.js` | No changes from v1 (comment-only diff) |
| `design/exports/v2/colors_and_type.css` | No changes from v1 |
| `design/exports/v2/uploads/design-994f6b45.md` | List-view-toggle UX spec (source of the list-view requirements) |

## Key visual decisions

**ViewToggle** — pill-shaped segmented control, centered below the squad header.
Active tab: `--fpl-accent` fill, `--fpl-accent-ink` text, drop-shadow. Outer container
has a dark fill with a hairline border.

**ListView** — horizontally scrollable stat table. Sticky identity column (168px) with a
soft drop shadow at the right edge to indicate scrollability. Column header row sticky to
the top. The Pts (total_points) column is highlighted in accent green at heavier weight.
Zero values are dimmed to `--fpl-muted-soft`; all others at `--fpl-text-soft`.

**PositionBadge** — four distinct color pairs (GK: yellow/dark, DEF: blue/dark, MID:
green/dark, FWD: red/white). These colors are currently inlined in `list.jsx` and need to
be promoted to tokens (task 10).

**Logo mark** — lightning bolt (`path` SVG) on a `--fpl-accent` square (radius
`--fpl-radius-lg`). Replaces the previous pitch-square outline SVG on a dark background.

**Entry button** — enabled state now fills in `--fpl-accent` with `--fpl-accent-ink` label,
consistent with every other primary call-to-action in the dark-palette design.
