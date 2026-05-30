# CLAUDE.md — project rules for the FPL Squad Viewer

This file is read at the start of every chat in this project. Treat it as
the standing brief. Update it whenever a new rule is agreed, a preference
is corrected, or a piece of architecture is decided.

## Project overview

Mobile-first viewer for a public Fantasy Premier League team identified by
team ID. No auth. Greenfield MVP — see `uploads/design-4159c274.md` (always
read the latest `design*.md` upload before changing UX) for the canonical
UX/tech spec.

Two screens:
1. **Entry** — capture + validate a team ID
2. **Squad** — header · gameweek control · gameweek summary strip · pitch
   (4-4-2-style with starting XI placed by position) · bench strip

## How the user communicates

- Writes in **Russian**; UI copy and code stay in **English**.
- Direct, low-ceremony. Skip preamble; show the result.
- When a `design*.md` is re-uploaded, the user expects me to **diff against
  the old one and apply only the changes** (not start from scratch).

## Visual direction

- Deep-purple surface stack, **neon-green accent #00FF87** for anything
  interactive or value-emphatic.
- Green football pitch with white markings, real shirt imagery on top.
- Crisp display sans (Space Grotesk) + mono for raw data (JetBrains Mono).
- **Do not draw club kits as SVG silhouettes** — use real shirt images
  (`assets/shirts/shirt_{teamCode}.webp`). The user stores additional kits
  in code; if a club is missing here, ask but keep a fallback so the
  layout still renders.

## Design-system rules

- **Single source of truth = `tokens.js`** (populates `window.FPL_TOKENS`).
  Mirror in `colors_and_type.css` as `--fpl-*` vars. Whenever a new token
  is added, add it to **both** files in the same change.
- **No hardcoded colors / fonts / sizes** inside `pitch.jsx`,
  `screens.jsx`, or any preview card. Read from tokens.
- **All component states must be shown** in the design system: idle,
  hover, pressed, focus (keyboard), disabled, plus loading where it
  applies. Edit the existing preview card — don't add `-states` siblings.
- **Preview cards** live in `preview/` and are registered in the asset
  manifest with a `group` tag (`Colors` · `Type` · `Spacing` ·
  `Components` · `Brand`).
- **`FPL Design System.html`** is the human-facing index of the system —
  it is **not** an app screen; it is for the user to browse the system.
  Keep it inline (no iframes), styled on the actual tokens.

## Files & their roles

| File | Role |
|---|---|
| `tokens.js` | JS source of truth (loaded as plain `<script>`). |
| `colors_and_type.css` | CSS-variable form of the same tokens. |
| `pitch.jsx` | Components for the pitch view (Jersey, Pitch, PitchPlayer, BenchStrip, AvailBadge, skeletons). |
| `list.jsx` | List-view components (ViewToggle, ListView, PositionBadge, CapInlineBadge, ListViewSkeleton). |
| `screens.jsx` | Full screens — Entry + Squad — built from pitch.jsx + list.jsx. |
| `assets/shirts/` | Real club kit images, named `shirt_{teamCode}.webp`. |
| `preview/*.html` | Design-system cards (one per token / component). |
| `FPL Design System.html` | Human index of the system. |
| `FPL Squad Viewer.html` | Pitch-layout design sheet — every screen × state on one design canvas. |
| `README.md` | Plain-language overview of the system. |
| `SKILL.md` | Agent-Skill front-matter so the system can be downloaded into Claude Code. |

## UX rules locked in so far

- **Per-player points = raw player score**, never doubled for the
  captain. The captain marker conveys captaincy.
- **Gameweek summary `TOTAL` = net** (after any transfer-cost hit).
- **Missing summary value** renders as em-dash `—`, never as `null` or an
  error.
- **Availability flag types** (per `design*.md`): doubtful · injured ·
  suspended · unavailable. Selecting a flagged player reveals their news
  text + chance-of-playing %.
- **GW navigation bounds**: prev disabled at GW 1, next disabled at the
  current (latest available) GW.
- **Pitch row order (top → bottom)**: FWD · MID · DEF · GK. Team attacks
  upward, goalkeeper sits at the bottom — matches the official FPL app.
- **Squad screen has two views**: `pitch` and `list`, persisted in the
  URL as `?view=pitch|list` (default `pitch`). Toggle is a segmented
  pill control under the squad header, centered. List view groups
  players GK · DEF · MID · FWD · Bench (per design-994f6b45.md) — note
  the **list view** uses ascending position order, while the **pitch**
  flips it because the team attacks upward.
- **List view layout**: identity column (kit + name + position pill +
  club) is `position: sticky; left: 0`; stat columns (Pts, MP, GS, A,
  CS, GC, OG, PS, PM, YC, RC, S, Bonus) scroll horizontally. Pts column
  is highlighted in accent green. Zero values render in muted text so
  meaningful numbers stand out.
- **Stat field names** match the FPL `/event/{gw}/live/` payload
  exactly (`total_points`, `minutes`, `goals_scored`, …) — no
  translation layer at the proxy.

## Things to ask before guessing

- A new club appears without a kit file → ask which `shirt_*.webp` to use.
- The `design*.md` introduces a new screen state → diff and confirm
  before making it permanent.
- Tone or copy decisions on Entry (we already locked "See your FPL
  squad and points — just enter your team ID").

## Workflow defaults

- After any non-trivial change, call `done` then `fork_verifier_agent`.
- Use the design canvas (`FPL Squad Viewer.html`) for all screen-level
  iterations; add new states as artboards rather than new HTML files.
- When the user uploads a new `design*.md`, I read it, diff against the
  previous version, and apply only the deltas — same for shirt batches.

---

> Append to this file as new rules emerge. Don't paraphrase — quote the
> user's preference verbatim where possible.
