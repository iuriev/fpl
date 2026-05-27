# Ideas & Feature Backlog

> Single source of truth for all product ideas — bugs, UX tweaks, features, and long-term bets.
> Sourced from: personal Notes (26–27 May 2026), `docs/backlog.md`, and ongoing development sessions.
>
> **Workflow:** ideas live here until they're ready to be built. To promote an idea:
> run `/opsx:propose` to turn it into an OpenSpec change proposal.

---

## 🐛 Bugs (fix immediately)

### BUG-01: Transfer screen allows invalid squad composition [FIXED]
The position validation in the transfer planner does not prevent selecting more than 5 defenders,
5 midfielders, or 3 forwards — violating FPL squad rules.
The limit is: GKP 1, DEF 3–5, MID 2–5, FWD 1–3 (15 players total, at least 1 of each outfield pos).

### BUG-02: Swap highlight in transfer planner is visually broken [FIXED]
The "player being replaced" yellow highlight is ugly. Needs a proper directional swap indicator:
a green arrow pointing up (new player in) and a red arrow pointing down (player going out),
matching FPL design conventions.

---

## ⚡ Quick UX wins (Transfer screen — next sprint)

### UX-01: Limit SwapsStrip to 3 visible rows with scroll
When there are more than 3 active swaps in the plan strip, truncate to 3 and add explicit scroll,
so the strip doesn't take over the screen.

### UX-02: Player picker bottom sheet — next 3 fixtures column
In the player picker list (PlayerPickerRow), add a "next 3 fixtures" column showing the next
3 scheduled matches for that player with difficulty colour coding. Show the GW number in the
table header to make it immediately clear which gameweeks they correspond to.
Reference: how fpl.team renders the Upcoming Fixtures in the player detail popup.

**Column layout:** `Name | % | £ | pts | xPts` (green header row)
Each row: `[kit] {Name} {pos}/{team} | {ownership%} | {price} | {total pts} | {xPts} | i`

### UX-03: Player picker bottom sheet — richer data columns
Add the following columns to PlayerPickerRow (currently missing):
ownership %, total season points (pts), and expected points (xPts).

### UX-04: Player card — info button for upcoming fixtures
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

---

## 🎨 Design system & visual standards

### DES-04: Standardize FDR difficulty colours across the entire app
Use these exact colours for all fixture difficulty indicators, FDR chips, and calendar cells:
- 1 = dark green (easiest)
- 2 = light green
- 3 = grey / white (neutral)
- 4 = red / pink
- 5 = dark maroon (hardest)

Reference: fplukraine.com Difficulties palette.

### VIS-01: Player card goals/assists visual counter badges
On PlayerCard, show visual counter badges for goals and assists:
- Goals: circle with number + football icon, e.g. `3 ⚽` in bottom-left
- Assists: separate counter in similar style
- Captain/Vice-Captain: badge top-right — "C" for captain (yellow), "V" for vice (green bg card)
- Ownership pill (purple) bottom-right, e.g. "136%"
- Points bar at the bottom (white bold name + purple points bar)

Reference: fpl.team B.Fernandes enhanced card style.

---

## 📊 Analytics & insights

### ANA-01: Gameweek review — "how did my week go?"
A post-gameweek screen or panel showing:
- Which players scored well / poorly
- Were the transfers a good decision (points gained/lost vs. keeping original player)
- "What-if you hadn't transferred anyone" comparison
Research what similar services do (fpl.team, fplukraine.com, etc.) and design accordingly.

### ANA-02: Most popular players (ownership%)
Show a list or widget of the most widely-owned players across all FPL managers —
effectively the global ownership%, sortable and filterable.
Already partially covered by `TopPlayersScreen` — consider extending it.

### ANA-03: Price change risers & fallers
Show players whose price has changed the most (up and down) — scoped to:
- Global (all FPL)
- Within the user's mini-league

Reference: fpl.team league tab with price filter.

### ANA-04: Top-ranked managers — view their squads
Surface the top-N ranked managers in the overall leaderboard with a one-tap link to view their
squad in the app (re-using the existing squad viewer with a different team ID).
Motivates competitive users to see what the best managers are doing.

### ANA-05: "Top 1% feature"
Research https://fpl.team/top/ and plan an equivalent:
what makes top 1% managers different — analyse their squads, captain picks, chip usage,
and transfer patterns. Show insights that help users emulate the best.

### ANA-06: Captain Poll
Community vote for the best captain pick each gameweek.
Poll format: "Who is the best GW{N} captain?" with top candidate options showing their fixture
e.g. `Haaland (MCI) vs AVL (H)`, `M.Salah (LIV) vs BRE (H)`.
Drives daily engagement before the deadline.

### ANA-07: All-time rank tracker
"What's My All-Time Rank?" — view the user's all-time FPL rank history and compare
their career trajectory with top managers worldwide.

### ANA-08: Captain Picks Analyzer
Show the user's historical captain pick record:
total captain points earned, success rate per pick, best/worst calls.

### ANA-09: Transfer Analyzer
Show the user's historical transfers:
net transfer points (total pts gained vs. cost of hits), which moves succeeded, which hurt.

### ANA-10: FPL Head-to-Head comparison
Compare two managers head-to-head across ranks, captain points, transfer efficiency,
and other key stats. Select from mini-league or by entering any team ID.

### ANA-11: Hindsight Dream Team
Show the user what their optimal squad would have been for each completed gameweek —
viewing missed points, potential totals, and efficiency rating.

### ANA-12: League participants browser
On the Stats / Leagues screen, click a league to see all participants.
Scroll the list; click a manager to view their squad using the existing squad viewer.
Reference: фича из заметки: "реализовать клик по лиге на странице stats".

---

## 🏆 Live scoring & rank tracking

### LIVE-01: Live rank tracker
During a gameweek, show real-time rank and live points updates:
- Live Points | Live Rank (with ↑↓ movement) | Week Rank
- Squad on pitch with live score per player
- Stats summary bar: Goals | Assists | Clean Sheets | Bonus | DEFCON
Reference: fpl.team live rank feature ("Watch your rank move live").

### LIVE-02: Live mini-league standings
Real-time league position movement during the gameweek — see exactly how close rivals are
before points are finalised. "Climb your mini-leagues faster."
Reference: fpl.team "Climb your mini-leagues faster".

---

## 🃏 Chips support

### CHIP-01: Display active chips on squad screen
When a user has an active chip (Wildcard, Free Hit, Triple Captain, Bench Boost), show a visible
indicator on the SquadScreen / SummaryStrip. Learn the official FPL chip lifecycle rules and
implement them correctly (when each chip can be played, once-per-season constraints, etc.).

### CHIP-02: Consider chips in transfer planner
The transfer planner should know whether a chip is active or can be played this GW:
- Wildcard: unlimited transfers, no cost
- Free Hit: temporary unlimited transfers, reverting next GW
- Bench Boost / Triple Captain: no transfer effect, but flag them

**Chip Strategy table layout (fpl.team reference):**
4 cards: Wildcard | Freehit | Benchboost | Triple Captain — each showing Week/Total scores
(GW38: 15 / 31 / 204 / 18 as example figures).

### CHIP-03: Free Hit — "best squad" assistant
When the user activates or is considering a Free Hit chip, show the optimal 15-player squad
for the upcoming gameweek based on fixture difficulty, form, and xPts.

### CHIP-04: Wildcard recommendation
Feature that recommends *when* to play the Wildcard chip — analysing the next 5 gameweeks'
fixture difficulty for the current squad vs. the potential squad improvement available.
Reference: fpl.team Chip Strategies panel.

### CHIP-05: Triple Captain recommendation
Tell the user the optimal gameweek to play Triple Captain, based on:
- Player xPts for that GW
- Fixture difficulty rating
- Home/away split

### CHIP-06: Bench Boost recommendation
Tell the user the optimal gameweek to play Bench Boost, based on:
- The 4 bench players' fixture difficulty and xPts
- Whether benched players have double gameweeks

---

## 🔮 Predictions & AI features

### PRED-01: Predicted points (xPts) on player cards
Show xPts (expected points) directly on the PlayerCard — a small numeric badge or sub-label
below the player's current GW score. Makes it trivially easy to compare "how is this player
expected to do next week" while viewing the squad.

### PRED-02: Predicted points list (freemium)
A dedicated screen showing all FPL players ranked by xPts for the next GW.
**Monetisation hook:** first 3 rows are free; the rest are blurred / locked behind a paid subscription.

**Layout (fpl.team reference):**
- Subtitle: "Click on a player to view their profile and compare predictions."
- Free rows: `[club badge] [player photo] {Name} {price}m {pos}/{team}/{ownership%}` → `xPts {value}` large right-aligned
- Locked rows: blurred photo + name, "🔒 Become a seasoned veteran to see all players", blurred xPts

### PRED-03: AI sort in transfer picker (premium gate)
Add a "Sort by AI" button in the player picker sheet that re-orders candidates by a proprietary
AI score. Tapping it shows a modal explaining it's a premium feature (requires subscription).
The button is visible but disabled for free users — creates upsell pressure.
Do **not** implement the underlying AI yet; just the UI gate.

### PRED-04: Full AI prediction engine (long-term research)
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

### PRED-05: Clean sheet probability & xG/xA market screen
Per-team market screen inspired by fplukraine.com:
- Left panel: CLEAN SHEET PROBABILITY — Team | Opponent chip (H/A badge) | Trend | CS%
- Right panel: EXPECTED GOALS — Team | Opponent chip | Trend | xG
Helps users identify clean sheet defenders and high-xG attackers at a glance.
Reference: fplukraine.com "Market" tab.

### PRED-06: FPL Price Change Predictions
Table showing players with predicted price change direction and probability:
Columns: Player | Team | Current Price | Transfer In % | Price Δ% | Likelihood (Unlikely / Likely / Very Likely)
Green progress bars for "in" probability; colour-coded likelihood badge.

### PRED-07: Predicted goals & assists screen
Separate ranked lists for Goals and Assists with probability values per player:
- E.g. Haaland 0.76 goals, B.Fernandes 0.41 assists
- Orange highlight on top 3 values
- Green-blue gradient card background per player
Reference: fpl.team predicted stats section.

### PRED-08: Predicted lineups for all 20 Premier League teams
Before each GW deadline, show the predicted starting XI for every PL team:
- Table view: Name | xMins | xPts (highlight yellow = rotation risk)
- Pitch view: circular player photos on formation grid with match info
- Confidence % badge + match date shown
- "Bench risk" highlighting for players likely to be rotated
Reference: fpl.team Predicted Lineups + LazyFPL.

### AI-01: Personal FPL AI analyst chat (freemium)
Team-aware AI chat assistant embedded in the app:
- Knows the user's squad, budget, and upcoming fixtures
- Answers questions: who to captain, whether to roll a transfer, fixture run analysis
- **Free tier:** 2–3 questions per GW; **Paid tier:** unlimited with larger context window
- UI: floating chat bubble → modal with chat history, input field
- Reference: fplukraine.com "FPL Помічник" + fpl.team AI assistant
Note: "Супер не на сейчас но вообще это крутая идея" — not for now, but definitely plan it.

---

## 📅 Planning & transfer tools

### PLAN-01: Multi-GW transfer planner with saved plans
Extend the transfer planner to support:
- Multiple saved plans (name each plan, compare them side by side)
- Multi-GW planning: plan transfers for GW N, N+1, N+2... tracking xPts improvement per GW
- Header showing Transfers used / Cost / Bank / xFTs
- **Monetisation:** 1 free plan; additional plans require subscription
Reference: fpl.team "Plan transfers before your rivals do".

### PLAN-02: Transfer solver / AI optimizer
Automatically suggest the optimal 1–2 transfers for the current GW:
- Analyses thousands of combinations based on fixtures, form, and value
- Shows multiple "plans" sorted by projected points gain
- Format: `Plan 1 | GW{N} | Player A → Player B | +{N} pts`
- "Get data-driven recommendations in seconds, not hours."
Reference: fpl.team Transfer Solver.

### WATCH-01: Player Watchlist
A screen where the user can add players they're interested in but not yet ready to transfer in.
Useful for long-term planning — build a shortlist without committing a transfer.
Note from user: "это страничка вотчлиси куда можно добавлять игроков которые тебе интересны
но ты пока не готов включать их в состав и тратить трансфер. Может быть полезно для длительного планирования"

### MGR-01: Manager Watchlist / Follow managers
Ability to follow specific managers and track them in a table:
Columns: Rank | Manager Name | Points | Rank Δ | Overall Rank | Transfers | Captain | Latest transfers | ✕
Click a row to view their squad using the existing squad viewer.
Note from user: "возможность следить за менеджерами и джоабвлять их. Вотч лист мне очень нравится нужно обязательно делать"

---

## 📐 Analytics deep-dives (statistics)

### STAT-01: DEFCON / BPS leaderboard
Two-sided ranking of players by in-match performance:
- **DEFCON** (worst performers): `{Player} {scored}/{possible}` e.g. Mount 13/12
  - Red badges, sorted worst first
- **BPS** (best performers): `{Player} {bps}({game count})` e.g. Dorgu 50(3)
  - Green badges, sorted best first
Can be integrated into the player info popup or as a standalone screen.

### STAT-02: Per-match points breakdown in player info view
In the player info popup (ⓘ), add a tab or expandable section showing:
how many points the player earned in each recent game and what for
(goals, assists, clean sheet, bonus, deductions).

### STAT-03: Three Player Comparison Tool
Compare up to 3 players side by side across key stats:
xPts, form, price, ownership%, upcoming fixtures FDR.
Reference: Fantasy Football Scout Chief Scout feature.

### STAT-04: Player xG Data & Heatmaps
Visualise a player's xG (expected goals) over time and positional heatmap on the pitch.
Reference: Fantasy Football Scout Chief Scout feature.

---

## 📅 Fixtures & calendar

### FIX-01: FDR screen (Fixture Difficulty Rating)
Dedicated screen showing fixture difficulty per team for the next N gameweeks.
Filter by N weeks, sortable by attack / defence / overall.
Reference: https://fpl.team/fdr/
Note: fpl.team already does this well — differentiate with AI angle instead.

### FIX-02: Full-season Fixtures Calendar
Full-season fixture calendar with multiple view modes:
- **FDR Heatmap** — colour-coded difficulty (green easy → maroon hard); teams ranked by avg difficulty
- **DGW & BGW** — double/blank gameweeks clearly marked for chip planning
- **Avg Difficulty** — average FDR across a configurable window of GWs
- **Recovery Calendar** — per-team rest-day bands to spot rotation risk; compare two players' minute loads
Filter tabs: Custom | Official | Rest Days | Overall | Defensive | Attacking
Reference: fpl.team Fixtures Calendar feature.

### FIX-03: Customisable Fixture Ticker
Compact, scrollable fixture ticker the user can configure — select which teams to watch,
filter by position, show only upcoming N gameweeks.
Reference: Fantasy Football Scout Chief Scout feature.

---

## 🤝 Social & community

### SOC-01: Squad comparison
Compare your squad side by side with any other manager's squad:
- Two-panel pitch view showing both squads with kit colours
- Stats per squad: budget, total pts, GW points, bench value
- Select opponent from your mini-league or enter any team ID
Reference: fplukraine.com squad comparison feature.

### SOC-02: Mini-league invite link
Register a custom mini-league within the app with a shareable invite link.
Users click the link to join and view the league's live standings.

---

## 🔑 User accounts & authentication

### AUTH-01: User accounts (login + Google OAuth)
Add authentication so users can save preferences across sessions:
- Login / password + "Sign in with Google"
- Backend stores: selected teams, followed managers, watchlists, custom settings
- Enables all personalised features (watchlist, custom plans, AI chat history)
Note: "мне обязательно нужна авторизация... чтобы пользователь мог сохранить в профиле свой аккаунт"

### AUTH-02: FPL OAuth / transfer execution integration
Research whether the official FPL API supports OAuth or credential-based authentication
so the app could execute transfers on the user's behalf.
This is complex and depends on FPL API capabilities — needs technical spike first.
Note: "как-ойто сингл сайн ап что юзер мог авторизоваться... и мы от его имени примерили трансферы"

---

## 🏁 Season start

### START-01: GW1 draft assistant
Before the season starts (GW1), offer a "Build your squad" assistant mode that recommends the
best possible initial 15-player squad. Uses budget (£100m), position constraints, and projected
xPts for the opening gameweek / fixture difficulty for the first 3–4 rounds.

---

## 💰 Monetisation

### MON-01: Premium subscription gate
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
Note: consider annual discount as the "recommended" option with heavy savings messaging.

### MON-02: Premium upsell banners
Add inline promo banners inside key screens (Transfer planner, Predicted points, Lineups)
motivating free users to upgrade:
- Dark purple/teal: "TEAM | LINEUPS / SUGGESTION TOOLS"
- "PLAYER PROJECTIONS / REMOVE ADS"
Reference: fpl.team inline premium promotion banners.

### MON-03: Donations / "Buy me a coffee"
Add a donate button alongside the subscription flow.
Options: Buy Me a Coffee link, Stripe, Monobank (Ukrainian users), or similar.
Note: "нужно подумать как юридически правильно это оформить" — legal check needed before launch.

---

## 🏠 App structure

### APP-01: About page
Create an "About" menu item that tells the story of the project.
Write original copy (do not copy fpl.team text); use https://fpl.team/about/ as layout reference only.

---

## 🎨 UX / Design

### DES-01: Desktop layout
The app is mobile-first (centered phone width on desktop). A proper responsive desktop layout
is a longer-term project. Tracked in ADR 0006.

### DES-02: Multi-language support (i18n)
All copy is centralised in `copy.ts` — the codebase is i18n-ready. Add language options beyond English.

### DES-03: FDR screen (Fixture Difficulty Rating)
Dedicated screen showing fixture difficulty per team for the next N gameweeks.
Filter by N weeks, sortable by attack / defence / overall.
Reference: https://fpl.team/fdr/

---

## 📋 Carried over from docs/backlog.md

These were already tracked in `docs/backlog.md` — preserved here for completeness:

- **Team of the Week badge** — small badge on player kit when they were in the official TOTW.
- **Player detail stats (points breakdown)** — tap a player to see goals/assists/bonus breakdown.
- **Live in-match scoring** — polling, live indicators, partial scores, substitution edge cases.
- **Gameweek bonus breakdown** — bonus points detail per player per GW.
- **Predictions / odds** — clean sheet / xG projections (overlaps with PRED-04 above).
- **AI assistant** — team-aware Q&A (as on fplukraine.com). High-priority concept; scope separately.

---

## 📌 Reference sites & resources

Sites to study for feature inspiration and UI patterns:

- **https://fpl.team/** — best independent FPL tool; strong reference for fixtures, predictions, chips, price changes, premium model.
- **https://fpl.team/top/** — Top 1% managers feature reference.
- **https://fpl.team/about/** — About page layout reference.
- **https://fplukraine.com** — AI assistant concept, squad comparison, CS probability & xG market screen.
- **https://cheatography.com/sertalpbilal/cheat-sheets/fpl-api-endpoints/** — FPL API endpoints cheat sheet (dev resource).
- **https://fantasyfootballscout.co.uk** — Alternative subscription model reference; DEFCON tables, xG heatmaps, captaincy matrix.
- Official FPL app — source of truth for rules and official UX conventions.
