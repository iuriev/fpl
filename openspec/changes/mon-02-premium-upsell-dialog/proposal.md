# Proposal: Premium upsell dialog (MON-02)

## Problem

The app has contextual premium prompts when watchlist limits are hit (`PremiumSheet`), but no
proactive conversion surface on high-intent screens. Users on the Transfer planner are actively
planning moves — the best moment to explain what Premium unlocks — yet nothing surfaces unless
they hit a hard limit elsewhere.

## Solution

A **blocking center-screen modal** (`<dialog>`) shown to **free-tier** users when they open
eligible screens, governed by **frontend env** cooldown settings. Copy is tuned for active FPL
managers (18–40): outcome-focused headline, three concrete benefits, free vs premium contrast.

Architecture follows **variant B**: a shared `PremiumUpsellProvider` that screens trigger via
`requestUpsell(screen)`; the provider owns cooldown checks, storage, and the dialog.

Primary CTA and dismiss paths **only close the modal** until MON-01 (real checkout) ships — no
redirect, no nested paywall sheet.

## User value

- Surfaces Premium value at the moment of planning (transfers), not only after friction.
- Respects frequency caps so the prompt does not feel spammy.
- Premium users never see the interruption.

## Scope

### In

- `PremiumUpsellDialog` — native `<dialog>`, centered, blocking backdrop (pattern:
  `DemoSignInDialog`).
- `PremiumUpsellProvider` + context + `requestUpsell('transfer' | 'predictions')`.
- `readPremiumUpsellConfig()` — `VITE_PREMIUM_UPSELL_ENABLED`, `VITE_PREMIUM_UPSELL_COOLDOWN_MS`
  (default 24h), `VITE_PREMIUM_DEV_IS_PREMIUM`.
- Per-screen `localStorage` last-shown timestamps; cooldown starts on **any** close path.
- **Transfer screen** integration after squad data is loaded.
- Copy in `copy.ts` (transfer + predictions variants; predictions wired when screen exists).
- Expose `subscriptionTier` on `GET /api/me` and `AuthUser` if not already present (DB column
  exists); `usePremiumStatus()` → hide dialog when `premium`.
- `web/.env.example` + env table in `docs/frontend.md`.
- Unit / integration tests for config, cooldown, tier gate, and Transfer trigger.

### Out of scope

- **MON-01** — payments, pricing page, Stripe, CTA navigation to checkout.
- **PRED-02** — Predicted points list screen (follow-up: one line in PRED-02 tasks to call
  `requestUpsell('predictions')`).
- **PRED-08** — Lineups screen banners (backlog detail mentioned lineups; not in MON-02 title).
- Replacing or merging `PremiumSheet` (watchlist limit-hit flow stays as-is).
- Changing Help Tour steps (no layout shift on Transfer beyond optional dialog overlay).

## Backlog ID

- **MON-02** — Inline premium upsell → **blocking premium upsell dialog** (description update
  when shipped).

## Dependencies

- `subscription_tier` column on `user` (already migrated).
- **MON-01** (soft) — CTA is close-only until billing exists; tier flag can be set manually in
  DB for testing.
- **PRED-02** (soft) — predictions variant copy + `requestUpsell('predictions')` deferred to
  that change.
- If **ana-03-pred-06-price-changes** ships first with `useSubscriptionTier()`, reuse that hook
  instead of duplicating; otherwise MON-02 adds `/me` + client tier read.

## Effort

**S** — Transfer-only integration; reusable provider + dialog; no proxy business logic beyond
`/me` field exposure.
