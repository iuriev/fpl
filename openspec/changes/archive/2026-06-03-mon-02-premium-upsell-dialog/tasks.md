# Tasks: Premium upsell dialog (MON-02)

## 1. Subscription tier on `/me`

- [x] 1.1 Add `subscriptionTier` to `GET /api/me` select + JSON response (`free` | `premium`)
- [x] 1.2 Extend `AuthUser` in `auth-client.ts` and auth provider mapping
- [x] 1.3 Proxy test: `/me` returns `subscriptionTier` for free and premium users
- [x] 1.4 Web: `usePremiumStatus()` (or reuse `useSubscriptionTier` if ana-03 landed) +
  `VITE_PREMIUM_DEV_IS_PREMIUM` override

## 2. Env config

- [x] 2.1 `readPremiumUpsellConfig.ts` — parse `ENABLED`, `COOLDOWN_MS` (fallback 86400000)
- [x] 2.2 Unit tests for env parsing edge cases
- [x] 2.3 Add variables to `web/.env.example`
- [x] 2.4 Document env vars in `docs/frontend.md`

## 3. Dialog component

- [x] 3.1 `PremiumUpsellDialog` — `<dialog>`, transfer + predictions copy props, a11y labels
- [x] 3.2 `PremiumUpsellDialog.module.css` — tokens only, mirror `DemoSignInDialog` motion
- [x] 3.3 Add copy keys to `copy.ts` (per design.md)
- [x] 3.4 `PremiumUpsellDialog.test.tsx` — render variants, CTA/dismiss/close fire `onClose`

## 4. Provider

- [x] 4.1 `PremiumUpsellContext.ts` — `requestUpsell(screen)` hook
- [x] 4.2 `PremiumUpsellProvider.tsx` — eligibility, storage keys, dialog state
- [x] 4.3 Provider unit tests — cooldown, enabled flag, premium skip, recordDismiss on all paths
- [x] 4.4 Mount provider in `App.tsx` (inside auth + my-team tree)

## 5. Transfer integration

- [x] 5.1 `TransferScreen` — `requestUpsell('transfer')` when squad loaded; ref guard for Strict Mode
- [x] 5.2 `TransferScreen.test.tsx` — dialog shown when eligible; hidden for premium / cooldown /
  disabled env
- [x] 5.3 Confirm Help Tour targets still valid (no task change unless layout breaks tests)

## 6. Finish

- [x] 6.1 `npm run lint` and `npm run test -w web` (+ proxy if `/me` touched)
- [x] 6.2 Update MON-02 row in `docs/backlog.md` (modal wording, link to change) when shipped
- [x] 6.3 Note in backlog PRED-02 detail: wire `requestUpsell('predictions')` on screen load
