# Design: Premium upsell dialog (MON-02)

## Architecture

```
┌──────────────── App ─────────────────────────────────────────┐
│  PremiumUpsellProvider                                         │
│    readPremiumUpsellConfig()  ← import.meta.env (always)      │
│    usePremiumStatus()         ← GET /me subscriptionTier     │
│    shouldShow(screen)         ← enabled ∧ ¬premium ∧ cooldown│
│    recordDismiss(screen)      ← localStorage lastShown       │
│    ┌─────────────────────────────────────┐                   │
│    │ PremiumUpsellDialog (native dialog) │                   │
│    └─────────────────────────────────────┘                   │
└──────────────────────────────────────────────────────────────┘
         ▲ requestUpsell('transfer')
         │ (after squad loaded)
┌────────┴────────┐
│ TransferScreen  │
└─────────────────┘

Watchlist limit → PremiumSheet (unchanged, bottom sheet)
```

## Environment variables (Vite)

| Variable | Default | Behaviour |
|----------|---------|-----------|
| `VITE_PREMIUM_UPSELL_ENABLED` | `true` | `'false'` disables all auto upsell dialogs |
| `VITE_PREMIUM_UPSELL_COOLDOWN_MS` | `86400000` (24h) | Parsed as integer; invalid / negative → fallback 24h |
| `VITE_PREMIUM_DEV_IS_PREMIUM` | `false` | `'true'` treats user as premium (skip dialog) |

Config is read at module load via `readPremiumUpsellConfig()`; cooldown logic **always** uses
the parsed value (never hardcode 24h except as fallback when env is invalid).

## Cooldown storage

| Key | When written |
|-----|----------------|
| `fpl_premium_upsell_last_transfer` | Any close on transfer variant |
| `fpl_premium_upsell_last_predictions` | Any close on predictions variant |

Show when: `Date.now() - parseInt(last, 10) >= cooldownMs` (missing key → show).

**Every dismiss path** records `lastShown = Date.now()`:

- ✕ button
- «Not this gameweek» text button
- Backdrop click
- Primary CTA «Get Premium» (closes only — no navigation)

## Premium status

```ts
type SubscriptionTier = 'free' | 'premium';

function usePremiumStatus(): boolean {
  if (import.meta.env.VITE_PREMIUM_DEV_IS_PREMIUM === 'true') return true;
  return user?.subscriptionTier === 'premium';
}
```

`GET /api/me` response adds `subscriptionTier` from DB (default `free`). Align with
`ana-03-pred-06-price-changes` if that change lands first — single hook name
`useSubscriptionTier()` is acceptable if already implemented.

## Dialog UI

Follow `DemoSignInDialog`:

- `<dialog>` + `showModal()` / `close()`
- `::backdrop` blocks interaction with page
- `@starting-style` enter animation
- Design tokens only (`--fpl-bg-panel`, `--fpl-accent`, spacing, radii in `rem`)
- `aria-labelledby` + `aria-describedby` on title and lead

Layout:

```
┌──────────────────────────────────┐
│  ✕                               │
│  ⭐ (decorative, aria-hidden)     │
│  H2 — outcome headline           │
│  P  — one-sentence lead            │
│  UL — 3 benefits                 │
│  Free line / Premium line        │
│  [ Get Premium — primary ]       │
│  Not this gameweek — text btn    │
└──────────────────────────────────┘
```

## Copy (English, `copy.ts`)

Target: active FPL players 18–40; direct, competitive tone; no fake pricing.

### Shared

| Key | Text |
|-----|------|
| `premiumUpsellCta` | Get Premium |
| `premiumUpsellDismiss` | Not this gameweek |
| `premiumUpsellAriaLabel` | Premium upgrade offer |

### Transfer variant

| Key | Text |
|-----|------|
| `premiumUpsellTransferTitle` | Don't leave points on the table |
| `premiumUpsellTransferLead` | Your rivals are already using projections and chip timing — you're still guessing. |
| `premiumUpsellTransferBenefit1` | Every player's predicted points for the next GW — not just the obvious top 3 |
| `premiumUpsellTransferBenefit2` | Know when to Wildcard, Free Hit, Bench Boost or Triple Captain — not just whether |
| `premiumUpsellTransferBenefit3` | Track 10 managers and 15 players on your watchlist while you plan moves |
| `premiumUpsellTransferFree` | Free: 2 watchlist slots · squad & transfers |
| `premiumUpsellTransferPremium` | Premium: full projections · planning tools · higher limits |

### Predictions variant (for PRED-02)

| Key | Text |
|-----|------|
| `premiumUpsellPredictionsTitle` | The haulers aren't in the top 3 |
| `premiumUpsellPredictionsLead` | The differentials that win mini-leagues sit further down the list — you can't see them on free. |
| `premiumUpsellPredictionsBenefit1` | Full xPts ranking for every player before the deadline |
| `premiumUpsellPredictionsBenefit2` | Spot price rises and template traps before they hit your rank |
| `premiumUpsellPredictionsBenefit3` | Projected lineups so you don't captain a bench risk |

## Transfer screen trigger

Call `requestUpsell('transfer')` once per visit when **all** hold:

1. `draft` and `squadData` ready (`!isLoading && !squadError && displaySquad.length > 0`)
2. Provider `shouldShow('transfer')` is true

Use a ref guard so Strict Mode double-mount does not open twice in the same tick.

Do **not** show during loading, error, or empty squad states.

## Provider placement

Wrap inside `App.tsx` after `AuthProvider` / `MyTeamProvider` so `useCurrentUser()` is
available — same level as `PlayerWatchlistPremiumProvider` (sibling, not nested inside it).

## Testing notes

- Mock `import.meta.env` in config tests.
- Fake timers for cooldown eligibility.
- `localStorage` clear between tests.
- Transfer: dialog appears when eligible; absent when `subscriptionTier: 'premium'`.
- CTA click closes dialog and sets storage timestamp.

## Future (MON-01)

Replace CTA handler with checkout / pricing route; keep cooldown and tier gate unchanged.

## PRED-02 follow-up

Add to PRED-02 `tasks.md` when created:

- Wire `requestUpsell('predictions')` after list data loads (same cooldown rules).
