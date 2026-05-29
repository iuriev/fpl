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

## 🔴 P0 — Fix first (bugs in shipped features)

These are already in production and break expected behaviour.

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
| UX-04 | Player card ⓘ button → upcoming 5 fixtures + price popup | S | Great discoverability. Popup layout designed (see below). |
| DES-04 | Standardize FDR difficulty colours app-wide (1–5 palette) | XS | Must-have consistency before adding more FDR-based features. |
| VIS-01 | Goals/assists badge counters on PlayerCard | S | Visual clarity. Adds context without opening popup. |

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

#### VIS-01: Player card goals/assists visual counter badges
On PlayerCard, show visual counter badges for goals and assists:
- Goals: circle with number + football icon, e.g. `3 ⚽` in bottom-left
- Assists: separate counter in similar style
- Captain/Vice-Captain: badge top-right — "C" for captain (yellow), "V" for vice (green bg card)
- Ownership pill (purple) bottom-right, e.g. "136%"
- Points bar at the bottom (white bold name + purple points bar)

Reference: fpl.team B.Fernandes enhanced card style.

---

## 🟠 P1 — User accounts (enabler for all personalization)

Accounts unlock watchlists, saved plans, AI chat history, and manager following.
Build early so personalised features have somewhere to store data.

| ID | Task | Effort | Why |
|----|------|--------|-----|
| AUTH-01 | Login / password + Google OAuth, backend user profile | M | Required before watchlists, saved plans, or AI chat. |

### Feature details

#### AUTH-01: User accounts (login + Google OAuth)
Add authentication so users can save preferences across sessions:
- Login / password + "Sign in with Google"
- Backend stores: selected teams, followed managers, watchlists, custom settings
- Enables all personalised features (watchlist, custom plans, AI chat history)

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
| MGR-01 | Manager Watchlist — follow managers, see their points/transfers in a table | M | High priority. |
| WATCH-01 | Player Watchlist — shortlist of players you're tracking but not yet transferring | S | Low effort; high utility for planning. |

### Feature details

#### ANA-01: Gameweek review — "how did my week go?"
A post-gameweek screen or panel showing:
- Which players scored well / poorly
- Were the transfers a good decision (points gained/lost vs. keeping original player)
- "What-if you hadn't transferred anyone" comparison
Research what similar services do (fpl.team, fplukraine.com, etc.) and design accordingly.

#### ANA-02: Most popular players (ownership%)
Show a list or widget of the most widely-owned players across all FPL managers —
effectively the global ownership%, sortable and filterable.
Already partially covered by `TopPlayersScreen` — consider extending it.

#### ANA-03: Price change risers & fallers
Show players whose price has changed the most (up and down) — scoped to:
- Global (all FPL)
- Within the user's mini-league

Reference: fpl.team league tab with price filter.

#### ANA-04: Top-ranked managers — view their squads
Surface the top-N ranked managers in the overall leaderboard with a one-tap link to view their
squad in the app (re-using the existing squad viewer with a different team ID).
Motivates competitive users to see what the best managers are doing.

#### ANA-06: Captain Poll
Community vote for the best captain pick each gameweek.
Poll format: "Who is the best GW{N} captain?" with top candidate options showing their fixture
e.g. `Haaland (MCI) vs AVL (H)`, `M.Salah (LIV) vs BRE (H)`.
Drives daily engagement before the deadline.

#### ANA-07: All-time rank tracker
"What's My All-Time Rank?" — view the user's all-time FPL rank history and compare
their career trajectory with top managers worldwide.

#### ANA-08: Captain Picks Analyzer
Show the user's historical captain pick record:
total captain points earned, success rate per pick, best/worst calls.

#### ANA-09: Transfer Analyzer
Show the user's historical transfers:
net transfer points (total pts gained vs. cost of hits), which moves succeeded, which hurt.

#### ANA-10: FPL Head-to-Head comparison
Compare two managers head-to-head across ranks, captain points, transfer efficiency,
and other key stats. Select from mini-league or by entering any team ID.

#### ANA-11: Hindsight Dream Team
Show the user what their optimal squad would have been for each completed gameweek —
viewing missed points, potential totals, and efficiency rating.

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
Columns: Rank | Manager Name | Points | Rank Δ | Overall Rank | Transfers | Captain | Latest transfers | ✕
Click a row to view their squad using the existing squad viewer.

#### PRED-01: Predicted points (xPts) on player cards
Show xPts (expected points) directly on the PlayerCard — a small numeric badge or sub-label
below the player's current GW score. Makes it trivially easy to compare "how is this player
expected to do next week" while viewing the squad.

#### WATCH-01: Player Watchlist
A screen where the user can add players they're interested in but not yet ready to transfer in.
Useful for long-term planning — build a shortlist without committing a transfer.

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

### Feature details

#### PRED-02: Predicted points list (freemium)
A dedicated screen showing all FPL players ranked by xPts for the next GW.
**Monetisation hook:** first 3 rows are free; the rest are blurred / locked behind a paid subscription.

**Layout (fpl.team reference):**
- Subtitle: "Click on a player to view their profile and compare predictions."
- Free rows: `[club badge] [player photo] {Name} {price}m {pos}/{team}/{ownership%}` → `xPts {value}` large right-aligned
- Locked rows: blurred photo + name, "🔒 Become a seasoned veteran to see all players", blurred xPts

#### PRED-03: AI sort in transfer picker (premium gate)
Add a "Sort by AI" button in the player picker sheet that re-orders candidates by a proprietary
AI score. Tapping it shows a modal explaining it's a premium feature (requires subscription).
The button is visible but disabled for free users — creates upsell pressure.
Do **not** implement the underlying AI yet; just the UI gate.

#### PRED-05: Clean sheet probability & xG/xA market screen
Per-team market screen inspired by fplukraine.com:
- Left panel: CLEAN SHEET PROBABILITY — Team | Opponent chip (H/A badge) | Trend | CS%
- Right panel: EXPECTED GOALS — Team | Opponent chip | Trend | xG
Helps users identify clean sheet defenders and high-xG attackers at a glance.
Reference: fplukraine.com "Market" tab.

#### PRED-06: FPL Price Change Predictions
Table showing players with predicted price change direction and probability:
Columns: Player | Team | Current Price | Transfer In % | Price Δ% | Likelihood (Unlikely / Likely / Very Likely)
Green progress bars for "in" probability; colour-coded likelihood badge.

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

#### MON-02: Premium upsell banners
Add inline promo banners inside key screens (Transfer planner, Predicted points, Lineups)
motivating free users to upgrade:
- Dark purple/teal: "TEAM | LINEUPS / SUGGESTION TOOLS"
- "PLAYER PROJECTIONS / REMOVE ADS"
Reference: fpl.team inline premium promotion banners.

#### MON-03: Donations / "Buy me a coffee"
Add a donate button alongside the subscription flow.
Options: Buy Me a Coffee link, Stripe, Monobank (Ukrainian users), or similar.
Note: legal check needed before launch.

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
| PLAN-01 | Multi-GW transfer planner with saved plans (1 free, more = paid) | L | "Plan transfers before your rivals do." Strong monetisation anchor. |
| PLAN-02 | Transfer solver / AI optimizer | L | Suggests optimal transfers automatically. High perceived value. |

### Feature details

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
| FIX-03 | Customisable Fixture Ticker | M | Lightweight version of FIX-02 for quick fixture scanning. |
| ANA-06 | Captain Poll (community vote each GW) | M | Social feature; drives pre-deadline engagement and return visits. |
| SOC-01 | Squad comparison (side-by-side vs. another manager) | M | Fun social feature; re-uses squad viewer. |
| SOC-02 | Mini-league invite link | M | Viral acquisition channel for mini-league groups. |
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

#### FIX-03: Customisable Fixture Ticker
Compact, scrollable fixture ticker the user can configure — select which teams to watch,
filter by position, show only upcoming N gameweeks.
Reference: Fantasy Football Scout Chief Scout feature.

#### SOC-01: Squad comparison
Compare your squad side by side with any other manager's squad:
- Two-panel pitch view showing both squads with kit colours
- Stats per squad: budget, total pts, GW points, bench value
- Select opponent from your mini-league or enter any team ID
Reference: fplukraine.com squad comparison feature.

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
| STAT-02 | Per-match points breakdown in player info popup | S | Users want to know *why* a player scored what they scored. |
| ANA-08 | Captain Picks Analyzer | M | Helps users see if their captaincy decisions are paying off. |
| ANA-09 | Transfer Analyzer | M | Net transfer points history — was each transfer worth it? |
| ANA-10 | FPL Head-to-Head comparison | M | Competitive social feature for mini-league rivalries. |
| ANA-11 | Hindsight Dream Team ("what could I have scored?") | M | Gamification of reflection; drives discussion. |
| ANA-07 | All-time rank tracker | S | Career view. Simple chart over time. |

### Feature details

#### STAT-01: DEFCON / BPS leaderboard
Two-sided ranking of players by in-match performance:
- **DEFCON** (worst performers): `{Player} {scored}/{possible}` e.g. Mount 13/12 — Red badges, sorted worst first
- **BPS** (best performers): `{Player} {bps}({game count})` e.g. Dorgu 50(3) — Green badges, sorted best first

Can be integrated into the player info popup or as a standalone screen.

#### STAT-02: Per-match points breakdown in player info view
In the player info popup (ⓘ), add a tab or expandable section showing:
how many points the player earned in each recent game and what for
(goals, assists, clean sheet, bonus, deductions).

#### STAT-03: Three Player Comparison Tool
Compare up to 3 players side by side across key stats:
xPts, form, price, ownership%, upcoming fixtures FDR.
Reference: Fantasy Football Scout Chief Scout feature.

#### STAT-04: Player xG Data & Heatmaps
Visualise a player's xG (expected goals) over time and positional heatmap on the pitch.
Reference: Fantasy Football Scout Chief Scout feature.

---

## 🟢 P3 — Long-term & research-heavy

| ID | Task | Effort | Why / When |
|----|------|--------|------------|
| PRED-04 | Full AI prediction engine | XL | The big bet. Do this after PRED-02/03 validate demand and after MON-01 is live. |
| AI-01 | Personal FPL AI analyst chat (free 2-3 Qs, then paid) | XL | Build after AUTH-01 and PRED-04 are live. |
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

### Feature details

#### PRED-04: Full AI prediction engine (long-term research)
Deep research + build a prediction model that scores players for the next GW using:
- Current league table positions
- Key injury absences
- Recent form (last 3–5 GWs)
- Set-piece takers and penalty responsibilities
- Head-to-head match history
- Home / away performance splits
- Scrape/aggregate internet prediction articles (pre-match xPts predictions)
- Historical EPL results (consider bulk-importing last 20 years of results)
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

#### ANA-05: "Top 1% feature"
Research https://fpl.team/top/ and plan an equivalent:
what makes top 1% managers different — analyse their squads, captain picks, chip usage,
and transfer patterns. Show insights that help users emulate the best.

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
- **Summary Strip** — GW total, average, highest score, rank, transfers made
- **Team Info Panel** — drawer with team/manager stats
- **Dream Team Screen** — best XI for a GW
- **Gameweek History Screen** — per-GW points history chart/table
- **Leagues Stats Screen** — mini-league standings
- **Top Players Screen** — top performers for a GW
- **Transfer Planner** — pick players to transfer in/out, budget tracking, squad validation
- **Transfer screen polish** — captain badge right, team abbrev + FDR chip under PlayerCard, outfield picker, position filter tabs, Sort button (UX-01 SwapsStrip scroll, UX-02 next 3 fixtures column, UX-03 %, pts, xPts columns)
- **Fix bugs** — BUG-01 (position limits), BUG-02 (transfer arrows)
- **Proxy/BFF** — services for squad, entry, gameweeks, history, leagues, dream-team, fixtures, player pool, top players, team

---

## Sequencing rationale

The recommended order is:

1. **Finish Transfer screen polish** — the transfer planner is the app's deepest feature and the one users spend the most time with.
2. **User accounts** (AUTH-01) — enables all personalized features. Build early.
3. **Gameweek review + chip display + live rank** — creates weekly return habit before we build premium features.
4. **xPts + predicted points + premium gate** — builds the monetisation foundation.
5. **Watchlists + manager tracking + squad comparison** — social layer that drives virality.
6. **Multi-GW planner + transfer solver** — advanced planning tools, partly monetised.
7. **Full AI engine + chat assistant** — only after demand is validated and revenue is flowing.

---

## Reference sites

Sites to study for feature inspiration and UI patterns:

- **https://fpl.team/** — best independent FPL tool; strong reference for fixtures, predictions, chips, price changes, premium model.
- **https://fpl.team/top/** — Top 1% managers feature reference.
- **https://fpl.team/about/** — About page layout reference.
- **https://fplukraine.com** — AI assistant concept, squad comparison, CS probability & xG market screen.
- **https://cheatography.com/sertalpbilal/cheat-sheets/fpl-api-endpoints/** — FPL API endpoints cheat sheet (dev resource).
- **https://fantasyfootballscout.co.uk** — Alternative subscription model reference; DEFCON tables, xG heatmaps, captaincy matrix.
- Official FPL app — source of truth for rules and official UX conventions.
