# Proposal: Merge My Stats and My GW history into tabbed screen

## Problem

My Stats (league rankings) and My GW history (per-gameweek table) are separate full-page routes
(`/stats` and `/history`) and two drawer links. Managers treat both as “how am I doing?” and must
switch screens to compare leagues vs gameweek performance.

## Solution

Single **My Stats** screen at `/stats` with two tabs under one `ScreenHeader`:

| Tab | Label | Content |
| --- | --- | --- |
| Default | Leagues | Existing `LeaguesStatsScreen` body |
| `?tab=history` | My GW history | Existing `GameweekHistoryScreen` body |

- Remove `/history` route (no redirect — old URL is not preserved).
- Remove **My GW history** from `TeamInfoPanel`; **My Stats** remains the only entry.
- Squad back-navigation from a history row uses `returnTo: /stats?tab=history`.

## Scope

### In

- Web: `MyStatsScreen` shell, `LeaguesStatsPanel`, `GameweekHistoryPanel`.
- URL: `/stats`, `/stats?tab=history`; `gw` query param unchanged for league standings drill-down.
- Copy keys for tab labels; tests for tabs, drawer nav, routing.
- Spec deltas for combined screen and drawer.

### Out of scope

- Proxy/API changes.
- `/history` redirect or bookmark compatibility.
- Past-seasons or chip history.

## Effort

**S** — frontend-only refactor reusing existing data hooks and UI.
