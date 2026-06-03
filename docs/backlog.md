# Product Roadmap & Feature Backlog

> Living document. Updated as work is completed or priorities shift.
> Architecture rationale: `docs/decisions/`.
>
> **Workflow:** ideas live here until they're ready to be built.
> To promote a feature: run `/opsx:propose` to turn it into an OpenSpec change proposal.
>
> **How to read priorities:**
> - 🔴 **P0** — blocks users or is embarrassing; fix before shipping anything else
> - 🟠 **P1** — high-value, can be done quickly; do next
> - 🟡 **P2** — meaningful features, medium effort
> - 🟢 **P3** — long-term bets, research-heavy or high complexity

---

## 🔴 P0 — Fix first

| ID | Task | Effort | Why now |
|----|------|--------|---------|

### Fixed bugs

#### BUG-01: Transfer screen position validation [FIXED]
The position validation in the transfer planner did not prevent selecting more than 5 defenders,
5 midfielders, or 3 forwards — violating FPL squad rules.
The limit is: GKP 1, DEF 3–5, MID 2–5, FWD 1–3 (15 players total, at least 1 of each outfield pos).

#### BUG-02: Swap highlight visually broken [FIXED]
The "player being replaced" yellow highlight was ugly. Needs a proper directional swap indicator:
a green arrow pointing up (new player in) and a red arrow pointing down (player going out),
matching FPL design conventions.

---

## 🟠 P1 — Transfer screen polish

| ID | Task | Effort | Why |
|----|------|--------|-----|
| ~~UX-04~~ | ~~Player card ⓘ button → upcoming 5 fixtures + price popup~~ | S | ✅ Done — popup implemented in PlayerCard; wired in SquadScreen + TransferPitch. |
| ~~DES-04~~ | ~~Standardize FDR difficulty colours app-wide (1–5 palette)~~ | XS | ✅ Done — `--fpl-fdr-*` tokens in colors_and_type.css; FdrChip uses them everywhere. |
| ~~VIS-01~~ | ~~Goals/assists badge counters on PlayerCard~~ | S | ✅ Done — goal/assist badges on all card sizes; ownership % pill bottom-right of jersey. |
| ~~UX-05~~ | ~~Transfer screen help overlay — guided tour explaining every UI element~~ | S | ✅ Done — step-by-step help tour implemented using `HelpTour` component. |

### Feature details

#### UX-04: Player card — info button for upcoming fixtures
Add a small `ⓘ` icon to the PlayerCard (top-right corner, next to the transfer/swap icon).
Tapping it opens a compact popup / tooltip showing the player's upcoming fixtures and stats.

**Popup layout (based on fpl.team Rice/Cucurella reference):**
- Blue header: `{Name} - {price}m - {ownership}% - {position} / {team abbrev}` + X close
- "Upcoming Fixtures" section with rows: `{GW#} {team badge} (H/A) {opponent} | {xPts} xPts`
- Price section: `Purchase {n} | Current {n} | Sell {n}` with note about price drops

**Transfer state card style** (when player is being replaced):
- Green background = player out
- Top-left: yellow circle ↻ (undo swap), red circle ✕ (remove transfer) stacked
- Top-right: grey circle `i`
- Bottom: white name + price pill e.g. "Cucurella / £3.84"

#### DES-04: Standardize FDR difficulty colours across the entire app
Use these exact colours for all fixture difficulty indicators, FDR chips, and calendar cells:
- 1 = dark green (easiest)
- 2 = light green
- 3 = grey / white (neutral)
- 4 = red / pink
- 5 = dark maroon (hardest)

Reference: fplukraine.com Difficulties palette.

#### UX-05: Transfer screen help overlay (guided tour)

A "?" button (top-right of the Transfer screen header) that triggers a step-by-step highlight
overlay explaining each key UI element to the user. Shows once automatically on first visit,
then on demand via the button.

**Elements to explain (in tour order):**
1. **Chip badges (WC / FH / BB / TC)** — what each chip does and when it can be played.
2. **Bank / Free / Cost strip** — current budget remaining, free transfer count, and point cost of planned transfers.
3. **Captain (C) / Vice-captain (V) badges** — scoring multiplier and when the vice steps up.
4. **Ownership % pill** — percentage of all FPL managers who own this player (global ownership).
5. **FDR chip under player name** — opponent abbreviation + home/away indicator; colour = fixture difficulty (green easy → maroon hard).
6. **Transfer swap arrows (↑↓)** — green up = player in, red down = player out; tap to undo.
7. **Bench row** — the 4 bench players; auto-substitution order matters.
8. **Planned Transfers section** — summary of staged moves before saving; tap a player on the pitch to start planning.
9. **Reset / Save Plan buttons** — Reset clears all staged transfers; Save Plan commits the draft.

**Implementation notes:**
- Use a lightweight step-highlight overlay (Popover API or a simple positioned overlay + backdrop).
- Store "tour seen" flag in `localStorage` so it auto-plays once per browser, then only on demand.
- Tour should be dismissible at any step with an "✕ Skip" button.

#### VIS-01: Player card goals/assists visual counter badges
On PlayerCard, show visual counter badges for goals and assists:
- Goals: circle with number + football icon, e.g. `3 ⚽` in bottom-left
- Assists: separate counter in similar style
- Captain/Vice-Captain: badge top-right — "C" for captain (yellow), "V" for vice (green bg card)
- Ownership pill (purple) bottom-right, e.g. "136%"
- Points bar at the bottom (white bold name + purple points bar)

Reference: fpl.team B.Fernandes enhanced card style.

---

## 🟡 P2 — Analytics & engagement (next after transfer polish)

These features give the app reasons to return every gameweek — essential for growth.

| ID | Task | Effort | Why |
|----|------|--------|-----|
| ~~ANA-01~~ | ~~Gameweek review screen ("how did my week go?")~~ | M | ✅ Done — implemented on feature/ana-01-gameweek-review. |
| ~~CHIP-01~~ | ~~Display active chip on squad screen + SummaryStrip~~ | S | ✅ Done — chip cell replaces AVERAGE+HIGHEST in SummaryStrip. |
| ~~CHIP-02~~ | ~~Consider active chip in transfer planner (Wildcard = unlimited free transfers)~~ | S | ✅ Done — Wildcard and Free Hit now zero out transfer costs in the planner. |
| ~~ANA-03~~ | ~~Price change risers & fallers~~ | M | ✅ Done — combined with PRED-06 on `/price-changes` (OpenSpec `ana-03-pred-06-price-changes`). |
| ~~ANA-12~~ | ~~League participants browser (click league on Stats to see all members)~~ | S | ✅ Done — OpenSpec change 2026-06-02-ana-12-league-participants-browser. |
| ~~MGR-01~~ | ~~Manager Watchlist — follow managers, see their points/transfers in a table~~ | M | ✅ Done — OpenSpec change 2026-06-01-manager-watchlist. localStorage phase, max 5. |
| MGR-02 | Backend watchlist — migrate MGR-01 from localStorage to backend API | S | Depends on AUTH-01. Swap LocalStorageWatchlistRepository → ApiWatchlistRepository; no UI changes. |
| ~~MGR-03~~ | ~~Freemium watchlist limits — 2 entries free, 10 with subscription~~ | S | ✅ Done — limits implemented in LocalStorageWatchlistRepository (2 managers) and LocalStoragePlayerWatchlistRepository (2 players); upsell PremiumSheet wired via use-follow-team / use-follow-player. |
| ~~WATCH-01~~ | ~~Player Watchlist — shortlist of players you're tracking but not yet transferring~~ | S | ✅ Done. |
| ~~AUTH-01~~ | ~~Login / password + Google OAuth, backend user profile~~ | M | ✅ Done — OpenSpec change 2026-06-02-auth-01-user-accounts. |

### Feature details

#### ANA-01: Gameweek review — "how did my week go?"
A post-gameweek screen or panel showing:
- Which players scored well / poorly
- Were the transfers a good decision (points gained/lost vs. keeping original player)
- "What-if you hadn't transferred anyone" comparison
Research what similar services do (fpl.team, fplukraine.com, etc.) and design accordingly.

#### ANA-03: Price change risers & fallers [SHIPPED]
Shipped on `/price-changes` (Actual tab): GW and Season risers/fallers, position filter, top 50.
Combined with PRED-06 in OpenSpec `archive/2026-06-03-ana-03-pred-06-price-changes`.

#### ANA-06: Captain Poll
Community vote for the best captain pick each gameweek.
Poll format: "Who is the best GW{N} captain?" with top candidate options showing their fixture
e.g. `Haaland (MCI) vs AVL (H)`, `M.Salah (LIV) vs BRE (H)`.
Drives daily engagement before the deadline.

#### ANA-08: Captain Picks Analyzer
Show the user's historical captain pick record:
total captain points earned, success rate per pick, best/worst calls.

#### ANA-09: Transfer Analyzer
Show the user's historical transfers:
net transfer points (total pts gained vs. cost of hits), which moves succeeded, which hurt.

#### ANA-12: League participants browser
On the Stats / Leagues screen, click a league to see all participants.
Scroll the list; click a manager to view their squad using the existing squad viewer.

#### CHIP-01: Display active chips on squad screen
When a user has an active chip (Wildcard, Free Hit, Triple Captain, Bench Boost), show a visible
indicator on the SquadScreen / SummaryStrip. Learn the official FPL chip lifecycle rules and
implement them correctly (when each chip can be played, once-per-season constraints, etc.).

#### CHIP-02: Consider chips in transfer planner
The transfer planner should know whether a chip is active or can be played this GW:
- Wildcard: unlimited transfers, no cost
- Free Hit: temporary unlimited transfers, reverting next GW
- Bench Boost / Triple Captain: no transfer effect, but flag them

**Chip Strategy table layout (fpl.team reference):**
4 cards: Wildcard | Freehit | Benchboost | Triple Captain — each showing Week/Total scores.

#### LIVE-01: Live rank tracker
During a gameweek, show real-time rank and live points updates:
- Live Points | Live Rank (with ↑↓ movement) | Week Rank
- Squad on pitch with live score per player
- Stats summary bar: Goals | Assists | Clean Sheets | Bonus | DEFCON
Reference: fpl.team live rank feature ("Watch your rank move live").

#### LIVE-02: Live mini-league standings
Real-time league position movement during the gameweek — see exactly how close rivals are
before points are finalised. "Climb your mini-leagues faster."
Reference: fpl.team "Climb your mini-leagues faster".

#### MGR-01: Manager Watchlist / Follow managers
Ability to follow specific managers and track them in a table:
Columns: Manager | GW Pts | GW Rank | Overall Rank | Rank Δ | Transfers | Captain | Latest transfers in | ✕

Three ways to add a manager:
1. Manual team ID input
2. "Follow" button on any squad view (via TeamInfoPanel)
3. "From My Leagues" — browse classic league standings inline and follow

Click a row to view their squad using the existing squad viewer.

Phase 1: localStorage, max 5 entries. See OpenSpec change `2026-06-01-manager-watchlist`.
`WatchlistRepository` abstraction makes Phase 2 (MGR-02) a backend swap with no UI changes.

New proxy endpoints needed: `GET /api/entry/:teamId/transfers`, `GET /api/leagues/:leagueId/standings`.

#### MGR-02: Backend watchlist (depends on AUTH-01)
Migrate the watchlist from localStorage to the backend so it syncs across devices.
- New endpoint: `GET/POST/DELETE /api/user/watchlist`
- Implement `ApiWatchlistRepository` swapping out `LocalStorageWatchlistRepository`
- No UI changes — the `WatchlistRepository` interface is the seam

#### MGR-03: Freemium watchlist limits (depends on MGR-02 + MON-01)
Enforce tier-based limits on the watchlist:
- Free tier: 2 managers
- Premium subscription: 10 managers
`ApiWatchlistRepository.getLimit()` returns the cap based on subscription tier from auth context.
When `repo.add()` returns `'limit'` and user is on free tier, show upsell prompt (links to MON-01 premium flow).

#### WATCH-01: Player Watchlist
A screen where the user can add players they're interested in but not yet ready to transfer in.
Useful for long-term planning — build a shortlist without committing a transfer.

---

## 🟡 P2 — Predictions (freemium gate)

| ID | Task | Effort | Why |
|----|------|--------|-----|
| ~~PRED-06~~ | ~~FPL Price Change Predictions table~~ | M | ✅ Done — Tonight tab on `/price-changes` (OpenSpec `ana-03-pred-06-price-changes`). |
| PRED-05 | Clean sheet probability & xG/xA market screen (per-team stats) | M | Unique angle. Helps evaluate defenders and attackers efficiently. |
| PRED-07 | Predicted goals & assists screen | M | Complement to PRED-05; popular FPL decision-making tool. |
| PRED-08 | Predicted lineups for all 20 PL teams | L | Data-heavy. Needs reliable lineup data source research. |
| PRED-02 | Predicted points list screen (free: top 3, locked: rest) | M | Monetisation hook + genuinely useful feature. Needs xPts source. |

| MON-01 | Premium subscription flow (paywall, pricing page) | L | Unlocks revenue. Sequence: build the gate first, then the real feature (PRED-04). |
| ~~MON-02~~ | ~~Blocking premium upsell dialog on Transfer (Predicted Points with PRED-02)~~ | S | ✅ Done — archived `2026-06-03-mon-02-premium-upsell-dialog`; spec `openspec/specs/premium-upsell-dialog/`. |
| ~~MON-03~~ | ~~Donations / Monobank jar link in sidebar~~ | XS | ✅ Done — sidebar banner → `https://send.monobank.ua/jar/7UQvnCDwx8`; override via `VITE_DONATION_URL`. |

### Feature details

#### PRED-02: Predicted points list (freemium)
A dedicated screen showing all FPL players ranked by xPts for the next GW.
**Monetisation hook:** first 3 rows are free; the rest are blurred / locked behind a paid subscription.
On screen load (data ready), call `requestUpsell('predictions')` from `PremiumUpsellProvider` (MON-02).

**Layout (fpl.team reference):**
- Subtitle: "Click on a player to view their profile and compare predictions."
- Free rows: `[club badge] [player photo] {Name} {price}m {pos}/{team}/{ownership%}` → `xPts {value}` large right-aligned
- Locked rows: blurred photo + name, "🔒 Become a seasoned veteran to see all players", blurred xPts

#### PRED-05: Clean sheet probability & xG/xA market screen
Per-team market screen inspired by fplukraine.com:
- Left panel: CLEAN SHEET PROBABILITY — Team | Opponent chip (H/A badge) | Trend | CS%
- Right panel: EXPECTED GOALS — Team | Opponent chip | Trend | xG
Helps users identify clean sheet defenders and high-xG attackers at a glance.
Reference: fplukraine.com "Market" tab.

#### PRED-06: FPL Price Change Predictions [SHIPPED]
Shipped as Tonight tab on `/price-changes`: heuristic likelihood (Likely / Very Likely),
transfer-in %, premium-gated My squad filter. OpenSpec `archive/2026-06-03-ana-03-pred-06-price-changes`.

#### PRED-07: Predicted goals & assists screen
Separate ranked lists for Goals and Assists with probability values per player:
- E.g. Haaland 0.76 goals, B.Fernandes 0.41 assists
- Orange highlight on top 3 values
- Green-blue gradient card background per player
Reference: fpl.team predicted stats section.

#### PRED-08: Predicted lineups for all 20 Premier League teams
Before each GW deadline, show the predicted starting XI for every PL team:
- Table view: Name | xMins | xPts (highlight yellow = rotation risk)
- Pitch view: circular player photos on formation grid with match info
- Confidence % badge + match date shown
- "Bench risk" highlighting for players likely to be rotated
Reference: fpl.team Predicted Lineups + LazyFPL.

#### MON-01: Premium subscription gate
All "premium" features (AI sort, full predicted points list, chip strategy advisor, etc.) require
a subscription. Design the subscription flow: paywall screen, pricing, subscription management.
The free tier gives: squad viewer, transfers, basic stats. The paid tier unlocks AI features.

**Subscription tier reference (fpl.team):**
- **Wonderkid:** £2.08/mo (annual) — 2 Drafts, Basic Predictions, Public Leagues ≤1k, No Ads
- **Seasoned Veteran:** £4.16/mo (annual), MOST POPULAR — 100k AI tokens, 10 Drafts, Complete Predictions, All Stats

**Alternative three-tier model (Fantasy Football Scout):**
- **Free (Assistant Scout):** community, articles, basic fixture ticker, weekly newsletter
- **Annual (Chief Scout):** £4.17/mo — AI tools, OPTA data, transfer planners, captaincy matrix, xG heatmaps
- **Monthly (Chief Scout):** £10.00/mo — same features, no annual commitment

#### MON-02: Premium upsell dialog
Blocking center modal for **free-tier** users on high-intent screens (Transfer now;
Predicted Points when PRED-02 ships). Shared `PremiumUpsellProvider`; cooldown from
`VITE_PREMIUM_UPSELL_COOLDOWN_MS` (default 24h). Primary CTA closes only until MON-01.
Reference: fpl.team promotion tone; implementation in `mon-02-premium-upsell-dialog`.

#### MON-03: Donations / Monobank jar [SHIPPED]
Sidebar footer banner links to the Monobank jar (`send.monobank.ua`). Default jar URL is
built in; override with `VITE_DONATION_URL`, disable with `VITE_DONATION_ENABLED=false`.
Note: legal check needed before public launch.

---

## 🟡 P2 — Chip strategy advisor

| ID | Task | Effort | Why |
|----|------|--------|-----|
| CHIP-03 | Free Hit "best squad" assistant | L | Need xPts data + optimisation logic. High value in double-GW weeks. |
| CHIP-04 | Wildcard recommendation (next 5 GWs FDR analysis) | L | Most asked FPL question: "should I wildcard now?" |
| CHIP-05 | Triple Captain recommendation | M | Straightforward: rank players by xPts × FDR for each GW. |
| CHIP-06 | Bench Boost recommendation | M | Similar to TC but sum of bench 4 players' xPts. |

### Feature details

#### CHIP-03: Free Hit — "best squad" assistant
When the user activates or is considering a Free Hit chip, show the optimal 15-player squad
for the upcoming gameweek based on fixture difficulty, form, and xPts.

#### CHIP-04: Wildcard recommendation
Feature that recommends *when* to play the Wildcard chip — analysing the next 5 gameweeks'
fixture difficulty for the current squad vs. the potential squad improvement available.
Reference: fpl.team Chip Strategies panel.

#### CHIP-05: Triple Captain recommendation
Tell the user the optimal gameweek to play Triple Captain, based on:
- Player xPts for that GW
- Fixture difficulty rating
- Home/away split

#### CHIP-06: Bench Boost recommendation
Tell the user the optimal gameweek to play Bench Boost, based on:
- The 4 bench players' fixture difficulty and xPts
- Whether benched players have double gameweeks

---

## 🟡 P2 — Planning tools

| ID | Task | Effort | Why |
|----|------|--------|-----|
| PLAN-00 | Backend transfer draft — migrate `fpl-transfer-draft-*` from localStorage to Postgres (1 draft per user; delete on team change or stale GW) | S | Cross-device persistence. OpenSpec `transfer-draft-backend`. |
| PLAN-01 | Multi-GW transfer planner with saved plans (1 free, more = paid) | L | "Plan transfers before your rivals do." Strong monetisation anchor. |
| PLAN-02 | Transfer solver / AI optimizer | L | Suggests optimal transfers automatically. High perceived value. |

### Feature details

#### PLAN-00: Backend transfer draft
Migrate transfer planner persistence from `localStorage` (`fpl-transfer-draft-{teamId}`) to
`/api/me/transfer-draft`. One draft per user; deleting draft when GW passes or user changes
`fpl_team_id`; one-shot import from localStorage. See OpenSpec `transfer-draft-backend`.

#### PLAN-01: Multi-GW transfer planner with saved plans
Extend the transfer planner to support:
- Multiple saved plans (name each plan, compare them side by side)
- Multi-GW planning: plan transfers for GW N, N+1, N+2... tracking xPts improvement per GW
- Header showing Transfers used / Cost / Bank / xFTs
- **Monetisation:** 1 free plan; additional plans require subscription
Reference: fpl.team "Plan transfers before your rivals do".

#### PLAN-02: Transfer solver / AI optimizer
Automatically suggest the optimal 1–2 transfers for the current GW:
- Analyses thousands of combinations based on fixtures, form, and value
- Shows multiple "plans" sorted by projected points gain
- Format: `Plan 1 | GW{N} | Player A → Player B | +{N} pts`
Reference: fpl.team Transfer Solver.

---

## 🟡 P2 — Fixtures & discovery

| ID | Task | Effort | Why |
|----|------|--------|-----|
| FIX-02 | Full-season Fixtures Calendar (FDR heatmap, DGW/BGW, Recovery views) | L | One of fpl.team's most-used features. Long build but very high utility. |
| ANA-06 | Captain Poll (community vote each GW) | M | Social feature; drives pre-deadline engagement and return visits. |
| APP-01 | About page | S | Builds trust. Needed before wider launch. |

### Feature details

#### FIX-02: Full-season Fixtures Calendar
Full-season fixture calendar with multiple view modes:
- **FDR Heatmap** — colour-coded difficulty (green easy → maroon hard); teams ranked by avg difficulty
- **DGW & BGW** — double/blank gameweeks clearly marked for chip planning
- **Avg Difficulty** — average FDR across a configurable window of GWs
- **Recovery Calendar** — per-team rest-day bands to spot rotation risk; compare two players' minute loads

Filter tabs: Custom | Official | Rest Days | Overall | Defensive | Attacking
Reference: fpl.team Fixtures Calendar feature.

#### SOC-02: Mini-league invite link
Register a custom mini-league within the app with a shareable invite link.
Users click the link to join and view the league's live standings.

#### APP-01: About page
Create an "About" menu item that tells the story of the project.
Write original copy (do not copy fpl.team text); use https://fpl.team/about/ as layout reference only.

---

## 🟡 P2 — Deep analytics

| ID | Task | Effort | Why |
|----|------|--------|-----|
| STAT-01 | DEFCON / BPS leaderboard screen | S | Unique FPL insight. Data source needs research (cheatography API?). |
| ANA-08 | Captain Picks Analyzer | M | Helps users see if their captaincy decisions are paying off. |
| ANA-09 | Transfer Analyzer | M | Net transfer points history — was each transfer worth it? |
### Feature details

#### STAT-01: DEFCON / BPS leaderboard
Two-sided ranking of players by in-match performance:
- **DEFCON** (worst performers): `{Player} {scored}/{possible}` e.g. Mount 13/12 — Red badges, sorted worst first
- **BPS** (best performers): `{Player} {bps}({game count})` e.g. Dorgu 50(3) — Green badges, sorted best first

Can be integrated into the player info popup or as a standalone screen.


---

## 🟢 P3 — Long-term & research-heavy

| ID | Task | Effort | Why / When |
|----|------|--------|------------|
| INF-03 | Redis cache + фонова prefetch-стратегія для масштабу 5000+ юзерів | L | Замінює in-memory кеш на Redis; фонові jobs тягнуть популярні squad IDs заздалегідь. Потрібно тільки після валідації попиту. |
| PRED-04 | Full AI prediction engine | XL | The big bet. Do this after PRED-02/03 validate demand and after MON-01 is live. |
| AI-01 | Personal FPL AI analyst chat (free 2-3 Qs, then paid) | XL | Build after AUTH-01 and PRED-04 are live. |
| AUTH-02 | FPL OAuth / transfer execution | XL | Complex. Needs FPL API capability research first (may not be possible). |
| START-01 | GW1 draft assistant | L | Seasonal feature (once a year). High viral potential before season start. |
| DES-01 | Desktop responsive layout | L | Low priority while the app is pre-launch / mobile-first. |
| SOC-02 | Mini-league invite link | M | Viral acquisition channel. Deprioritised — revisit after core analytics features are done. |
| ANA-10 | Player detail stats (points breakdown) | M | Nice-to-have. FPL app does this — we can differentiate with AI commentary. |
| LIVE-03 | Live in-match scoring | L | Complex edge cases. Research spikes needed. |
| VIS-02 | Team of the Week badge on squad screen | S | Polish feature. Simple once data source is confirmed. |

### Feature details

#### INF-03: Redis cache + background prefetch (5000+ users)
Replace the current in-process `Map`-based cache with Redis so the cache survives restarts
and is shared across multiple proxy instances (horizontal scaling).

Additionally, introduce a background prefetch job:
- Track which `teamId` values are requested most often
- Pre-warm their squad/picks cache before the TTL expires
- During a live GW, prefetch the top-N most-active teams on a short interval

Stack suggestion: `ioredis` + a simple `node-cron` job. Consider moving to BullMQ for the
queue if the rate limiter (INF-02) needs a persistent queue too.

**Trigger:** only when INF-01 + INF-02 are insufficient (i.e. sustained 5000+ concurrent users).
Do not build before demand is validated — premature complexity.

#### PRED-04: Full AI prediction engine (long-term research)
Deep research + build a prediction model that scores players for the next GW using:
- Current league table positions
- Key injury absences
- Recent form (last 3–5 GWs)
- Set-piece takers and penalty responsibilities
- Head-to-head match history
- Home / away performance splits
- Scrape/aggregate internet prediction articles (pre-match xPts predictions)
- Historical EPL results (import dataset from GitHub, e.g. vaastav/FPL-data, instead of official API)
- Consider hooking up a free AI/ML model for the inference layer

**Output value:** best transfer recommendations, optimal first-GW squad, best Free Hit squad,
optimal Wildcard timing, best Triple Captain moment.

#### AI-01: Personal FPL AI analyst chat (freemium)
Team-aware AI chat assistant embedded in the app:
- Knows the user's squad, budget, and upcoming fixtures
- Answers questions: who to captain, whether to roll a transfer, fixture run analysis
- **Free tier:** 2–3 questions per GW; **Paid tier:** unlimited with larger context window
- UI: floating chat bubble → modal with chat history, input field
- Reference: fplukraine.com "FPL Помічник" + fpl.team AI assistant

#### AUTH-02: FPL OAuth / transfer execution integration
Research whether the official FPL API supports OAuth or credential-based authentication
so the app could execute transfers on the user's behalf.
This is complex and depends on FPL API capabilities — needs technical spike first.

#### START-01: GW1 draft assistant
Before the season starts (GW1), offer a "Build your squad" assistant mode that recommends the
best possible initial 15-player squad. Uses budget (£100m), position constraints, and projected
xPts for the opening gameweek / fixture difficulty for the first 3–4 rounds.

---

## What's already shipped ✅

For reference — features that are live in the codebase:

- **Squad Viewer** — pitch view, list view, gameweek navigation, player status badges
- **Proxy Optimization (INF-01, INF-02)** — current-GW TTL increased to 300s; request rate limiting (10 req/s) implemented in `fpl-client`
- **Help Tour (UX-05)** — interactive walkthrough explaining transfer screen elements (chips, cost strip, badges)
- **Chips in Planner (CHIP-02)** — Wildcard/Free Hit zero out transfer costs; chip selection in TransferHeader
- **Summary Strip** — GW total, average, highest score, rank, transfers made
- **Team Info Panel** — drawer with team/manager stats
- **Monobank donation banner (MON-03)** — pinned footer in team sidebar → Monobank jar; OpenSpec `archive/2026-06-03-mon-03-monobank-donation-banner`
- **Team of the Week Screen** — best XI for a GW
- **Gameweek History Screen** — per-GW points history chart/table
- **Leagues Stats Screen** — mini-league standings
- **Top Players Screen** — top performers for a GW
- **Transfer Planner** — pick players to transfer in/out, budget tracking, squad validation
- **Transfer screen polish** — captain badge right, team abbrev + FDR chip under PlayerCard, outfield picker, position filter tabs, Sort button (UX-01 SwapsStrip scroll, UX-02 next 3 fixtures column, UX-03 %, pts, xPts columns); UX-04 player info popup (fixtures + price); DES-04 FDR colour tokens; VIS-01 goals/assists badges + ownership pill on all card sizes
- **Cloudflare migration (INFRA-01)** — OpenSpec change `openspec/changes/infra-01-cloudflare-migration`; moves SPA to Cloudflare Pages and proxy to Cloudflare Workers; Supabase unchanged. Replaces Fly.io deployment.
- **Active chip display (CHIP-01)** — chip cell replaces AVERAGE+HIGHEST in SummaryStrip when a chip is active; octagonal badge icon + chip name + ACTIVE label; per-chip accent colours (Wildcard gold, Triple Captain red, Free Hit cyan, Bench Boost green)
- **Auth (AUTH-01)** — login/password + Google OAuth, backend user profile; OpenSpec change 2026-06-02-auth-01-user-accounts.
- **League participants browser (ANA-12)** — click a league in Stats to browse all participants and view their squads; OpenSpec change 2026-06-02-ana-12-league-participants-browser.
- **Price changes & predictions (ANA-03, PRED-06)** — `/price-changes` screen: Actual (GW/season risers/fallers) + Tonight predictions; All FPL free, My squad premium; player profile sheet; OpenSpec `ana-03-pred-06-price-changes`.
- **Fix bugs** — BUG-01 (position limits), BUG-02 (transfer arrows)
- **Proxy/BFF** — services for squad, entry, gameweeks, history, leagues, dream-team, fixtures, player pool, top players, team

---

## Sequencing rationale

The recommended order is:

1. **Finish Transfer screen polish** — done ✅
2. **Auth + watchlists + manager tracking** — done ✅; MGR-02 (backend watchlist) follows when AUTH-01 is in prod.
3. **xPts + predicted points + premium gate** — builds the monetisation foundation.
4. **Gameweek review + live rank** — creates weekly return habit.
5. **Multi-GW planner + transfer solver** — advanced planning tools, partly monetised.
6. **Full AI engine + chat assistant** — only after demand is validated and revenue is flowing.

---

## Reference sites

Sites to study for feature inspiration and UI patterns:

- **https://fpl.team/** — best independent FPL tool; strong reference for fixtures, predictions, chips, price changes, premium model.
- **https://fpl.team/top/** — Top 1% managers feature reference.
- **https://fpl.team/about/** — About page layout reference.
- **https://fplukraine.com** — AI assistant concept, squad comparison, CS probability & xG market screen.
- **https://cheatography.com/sertalpbilal/cheat-sheets/fpl-api-endpoints/** — FPL API endpoints cheat sheet (dev resource).
- **https://fantasyfootballscout.co.uk** — Alternative subscription model reference; DEFCON tables, xG heatmaps, captaincy matrix.
- **https://github.com/vaastav/FPL-data** — Historical FPL datasets (seasons 2016-present).
- Official FPL app — source of truth for rules and official UX conventions.
