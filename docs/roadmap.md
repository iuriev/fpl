# Product Roadmap & Prioritised Plan

> Living document. Updated as work is completed or priorities shift.
> Ideas source: `docs/ideas.md`. Architecture rationale: `docs/decisions/`.
>
> **How to read priorities:**
> - 🔴 **P0** — blocks users or is embarrassing; fix before shipping anything else
> - 🟠 **P1** — high-value, can be done quickly; do next
> - 🟡 **P2** — meaningful features, medium effort
> - 🟢 **P3** — long-term bets, research-heavy or high complexity

---

## 🔴 P0 — Fix first (bugs in shipped features)

These are already in production and break expected behaviour.

| ID | Task | Effort | Why now |
|----|------|--------|---------|
| BUG-01 | Fix position limit validation in transfer planner (max 5 DEF, 5 MID, 3 FWD) | S | Breaks FPL rules. Any user who finds it loses trust immediately. |
| BUG-02 | Replace ugly yellow swap highlight with green↑ / red↓ directional arrows | S | Visually broken. Every transfer shows this. |

---

## 🟠 P1 — Transfer screen polish (in progress)

The Transfer screen is the app's most complex feature and most valuable surface.
The 2026-05-26 plan (`docs/superpowers/plans/2026-05-26-transfer-screen-ui-polish.md`)
is already underway. Complete it, then layer in the additional UX wins below.

| ID | Task | Effort | Why |
|----|------|--------|-----|
| *(active)* | Captain badge right, team abbrev + FDR chip under PlayerCard, outfield picker, filter bar + Sort | M | Active work — see plan file |
| UX-02 | Add "next 3 fixtures" column to PlayerPickerRow + GW number in header | S | Top user request. Fixture data is already fetched by the proxy. |
| UX-03 | Add %, pts, xPts columns to PlayerPickerRow | S | Essential for evaluating a transfer pick. Data already in `player-pool-service`. |
| UX-01 | Limit SwapsStrip to 3 visible rows + scroll | XS | Quick layout fix. SwapsStrip already exists. |
| UX-04 | Player card ⓘ button → upcoming 5 fixtures + price popup | S | Great discoverability. Popup layout designed (see ideas.md UX-04). |
| DES-04 | Standardize FDR difficulty colours app-wide (1–5 palette) | XS | Must-have consistency before adding more FDR-based features. |
| VIS-01 | Goals/assists badge counters on PlayerCard | S | Visual clarity. Adds context without opening popup. |

---

## 🟠 P1 — User accounts (enabler for all personalization)

Accounts unlock watchlists, saved plans, AI chat history, and manager following.
Build early so personalised features have somewhere to store data.

| ID | Task | Effort | Why |
|----|------|--------|-----|
| AUTH-01 | Login / password + Google OAuth, backend user profile | M | Required before watchlists, saved plans, or AI chat. |

---

## 🟡 P2 — Analytics & engagement (next after transfer polish)

These features give the app reasons to return every gameweek — essential for growth.

| ID | Task | Effort | Why |
|----|------|--------|-----|
| ANA-01 | Gameweek review screen ("how did my week go?") | M | High stickiness: users come back to review after each GW deadline. |
| CHIP-01 | Display active chip on squad screen + SummaryStrip | S | Many users don't know which chip is active. Data in API already. |
| CHIP-02 | Consider active chip in transfer planner (Wildcard = unlimited free transfers) | S | Without this, the planner is wrong when a chip is active. |
| LIVE-01 | Live rank tracker — real-time points & rank during gameweek | M | "Watch your rank move live." High-stickiness during match days. |
| LIVE-02 | Live mini-league standings | M | Real-time rival tracking. Complements LIVE-01. |
| ANA-03 | Price change risers & fallers (global + mini-league) | M | Huge FPL meta driver. Users check this daily during the GW. |
| PRED-01 | xPts badge on PlayerCard | S | Single number that lets users scan their whole squad at a glance. |
| ANA-02 | Most popular players (ownership %) screen | S | TopPlayersScreen already exists — extend with ownership sort/filter. |
| ANA-04 | Top-ranked managers → view their squads | M | Viral / social feature. Re-uses existing squad viewer. |
| ANA-12 | League participants browser (click league on Stats to see all members) | S | Natural extension of existing leagues screen. |
| MGR-01 | Manager Watchlist — follow managers, see their points/transfers in a table | M | Noted by user as "нужно обязательно делать". |
| WATCH-01 | Player Watchlist — shortlist of players you're tracking but not yet transferring | S | Low effort; high utility for planning. |

---

## 🟡 P2 — Predictions (freemium gate)

| ID | Task | Effort | Why |
|----|------|--------|-----|
| PRED-06 | FPL Price Change Predictions table | M | Users obsess over price changes. Clear monetisation gate candidate. |
| PRED-05 | Clean sheet probability & xG/xA market screen (per-team stats) | M | Unique angle. Helps evaluate defenders and attackers efficiently. |
| PRED-07 | Predicted goals & assists screen | M | Complement to PRED-05; popular FPL decision-making tool. |
| PRED-08 | Predicted lineups for all 20 PL teams | L | Data-heavy. Needs reliable lineup data source research. |
| PRED-02 | Predicted points list screen (free: top 3, locked: rest) | M | Monetisation hook + genuinely useful feature. Needs xPts source. |
| PRED-03 | "Sort by AI" button in picker (UI gate only, no AI yet) | S | Creates premium upsell pressure with zero backend cost. Just a modal. |
| MON-01 | Premium subscription flow (paywall, pricing page) | L | Unlocks revenue. Sequence: build the gate first (PRED-03), then the real feature (PRED-04). |
| MON-02 | Inline premium upsell banners in Transfer / Predicted Points screens | S | Low-friction conversion nudge. Just HTML/CSS banners. |
| MON-03 | Donations / "Buy me a coffee" link | XS | Zero effort. Add link to About or footer before premium flow is ready. |

---

## 🟡 P2 — Chip strategy advisor

| ID | Task | Effort | Why |
|----|------|--------|-----|
| CHIP-03 | Free Hit "best squad" assistant | L | Need xPts data + optimisation logic. High value in double-GW weeks. |
| CHIP-04 | Wildcard recommendation (next 5 GWs FDR analysis) | L | Most asked FPL question: "should I wildcard now?" |
| CHIP-05 | Triple Captain recommendation | M | Straightforward: rank players by xPts × FDR for each GW. |
| CHIP-06 | Bench Boost recommendation | M | Similar to TC but sum of bench 4 players' xPts. |

---

## 🟡 P2 — Planning tools

| ID | Task | Effort | Why |
|----|------|--------|-----|
| PLAN-01 | Multi-GW transfer planner with saved plans (1 free, more = paid) | L | "Plan transfers before your rivals do." Strong monetisation anchor. |
| PLAN-02 | Transfer solver / AI optimizer | L | Suggests optimal transfers automatically. High perceived value. |

---

## 🟡 P2 — Fixtures & discovery

| ID | Task | Effort | Why |
|----|------|--------|-----|
| FIX-02 | Full-season Fixtures Calendar (FDR heatmap, DGW/BGW, Recovery views) | L | One of fpl.team's most-used features. Long build but very high utility. |
| FIX-03 | Customisable Fixture Ticker | M | Lightweight version of FIX-02 for quick fixture scanning. |
| ANA-06 | Captain Poll (community vote each GW) | M | Social feature; drives pre-deadline engagement and return visits. |
| SOC-01 | Squad comparison (side-by-side vs. another manager) | M | Fun social feature; re-uses squad viewer. |
| SOC-02 | Mini-league invite link | M | Viral acquisition channel for mini-league groups. |
| APP-01 | About page | S | Builds trust. Needed before wider launch. |

---

## 🟡 P2 — Deep analytics

| ID | Task | Effort | Why |
|----|------|--------|-----|
| STAT-01 | DEFCON / BPS leaderboard screen | S | Unique FPL insight. Data source needs research (cheatography API?). |
| STAT-02 | Per-match points breakdown in player info popup | S | Users want to know *why* a player scored what they scored. |
| ANA-08 | Captain Picks Analyzer | M | Helps users see if their captaincy decisions are paying off. |
| ANA-09 | Transfer Analyzer | M | Net transfer points history — was each transfer worth it? |
| ANA-10 | FPL Head-to-Head comparison | M | Competitive social feature for mini-league rivalries. |
| ANA-11 | Hindsight Dream Team ("what could I have scored?") | M | Gamification of reflection; drives discussion. |
| ANA-07 | All-time rank tracker | S | Career view. Simple chart over time. |

---

## 🟢 P3 — Long-term & research-heavy

| ID | Task | Effort | Why / When |
|----|------|--------|------------|
| PRED-04 | Full AI prediction engine | XL | The big bet. Do this after PRED-02/03 validate demand and after MON-01 is live. |
| AI-01 | Personal FPL AI analyst chat (free 2-3 Qs, then paid) | XL | "Super idea but not now." Build after AUTH-01 and PRED-04 are live. |
| ANA-05 | "Top 1% feature" (what makes the best managers different) | L | Viral potential. Needs data aggregation from FPL API + analysis layer. |
| STAT-03 | Three Player Comparison Tool | M | Nice tool. Build after STAT-04 (needs same data source). |
| STAT-04 | Player xG Data & Heatmaps | L | Requires StatsBomb / OPTA data integration. Research data sources first. |
| AUTH-02 | FPL OAuth / transfer execution | XL | Complex. Needs FPL API capability research first (may not be possible). |
| START-01 | GW1 draft assistant | L | Seasonal feature (once a year). High viral potential before season start. |
| DES-03 | FDR screen | M | Good utility but fpl.team already does this well. Differentiate with AI angle instead. |
| DES-01 | Desktop responsive layout | L | Low priority while the app is pre-launch / mobile-first. |
| DES-02 | i18n (multi-language) | M | Opens new markets (Ukrainian FPL community, etc.). Do after core features are stable. |
| *(backlog)* | Player detail stats (points breakdown) | M | Nice-to-have. FPL app does this — we can differentiate with AI commentary. |
| *(backlog)* | Live in-match scoring | L | Complex edge cases. Research spikes needed. |
| *(backlog)* | Team of the Week badge on squad screen | S | Polish feature. Simple once data source is confirmed. |

---

## What's already shipped ✅

For reference — features that are live in the codebase:

- **Squad Viewer** — pitch view, list view, gameweek navigation, player status badges
- **Summary Strip** — GW total, average, highest score, rank, transfers made
- **Team Info Panel** — drawer with team/manager stats
- **Dream Team Screen** — best XI for a GW
- **Gameweek History Screen** — per-GW points history chart/table
- **Leagues Stats Screen** — mini-league standings
- **Top Players Screen** — top performers for a GW
- **Transfer Planner** — pick players to transfer in/out, budget tracking, squad validation (partial — see BUG-01)
- **Proxy/BFF** — services for squad, entry, gameweeks, history, leagues, dream-team, fixtures, player pool, top players, team

---

## Sequencing rationale

The recommended order is:

1. **Fix bugs** (BUG-01, BUG-02) — nothing else ships while these are live.
2. **Finish Transfer screen polish** — the transfer planner is the app's deepest feature and the one users spend the most time with.
3. **User accounts** (AUTH-01) — enables all personalized features. Build early.
4. **Gameweek review + chip display + live rank** — creates weekly return habit before we build premium features.
5. **xPts + predicted points + premium gate** — builds the monetisation foundation.
6. **Watchlists + manager tracking + squad comparison** — social layer that drives virality.
7. **Multi-GW planner + transfer solver** — advanced planning tools, partly monetised.
8. **Full AI engine + chat assistant** — only after demand is validated and revenue is flowing.
