# Tasks: Email Verification (AUTH-03)

**Depends on:** AUTH-02 routing overhaul must be complete before implementing this change,
as AUTH-03 adds a gate condition to the routing state machine introduced there.

---

## Step 1 — Backend: enable better-auth emailVerification plugin with Resend

Outcome: on email/password sign-up, the backend sends a verification email via Resend;
the verification link marks `emailVerified = true` and auto-signs the user in.

- [ ] `proxy/package.json`: add `resend` to `dependencies`.
- [ ] `proxy/src/auth/auth.ts`:
  - Import `emailVerification` from `better-auth/plugins` and `Resend` from `resend`.
  - Instantiate `new Resend(process.env.RESEND_API_KEY)`.
  - Add `emailVerification` plugin with `sendOnSignUp: true`,
    `autoSignInAfterVerification: true`, and `sendVerificationEmail` sending via Resend:
    subject "Verify your FPL Squad Viewer email", plain-text body with the `url` link.
  - Use `process.env.FROM_EMAIL` for the sender address (fallback to a default).
- [ ] `proxy/.env.example`: add `RESEND_API_KEY=re_...` and `FROM_EMAIL=noreply@...`.
- [ ] `proxy/src/auth/auth.test.ts`: add test that `sendVerificationEmail` is called with
      the correct user email on signup (mock `Resend.emails.send`, assert it was invoked).

---

## Step 2 — Backend: document new Fly secrets

- [ ] `docs/architecture.md`: add `RESEND_API_KEY` and `FROM_EMAIL` to the Fly secrets
      table (already added in AUTH-01; extend the same table).

---

## Step 3 — Frontend: VerifyEmailScreen

Outcome: after email/password sign-up, the user lands on a screen that tells them to
check their inbox, with a working "Resend" button.

- [ ] `web/src/screens/VerifyEmailScreen/VerifyEmailScreen.tsx`: implement the screen
      (see design.md for state and render spec).
- [ ] `web/src/screens/VerifyEmailScreen/VerifyEmailScreen.module.css`: styles consistent
      with `SignInScreen` / `SignUpScreen` layout.
- [ ] `web/src/screens/VerifyEmailScreen/VerifyEmailScreen.test.tsx`: test render with
      user email displayed; test resend button triggers the correct API call; test error
      state on resend failure.
- [ ] `web/src/screens/index.ts`: export `VerifyEmailScreen`.
- [ ] `web/src/lib/copy.ts`: add `verifyEmailHeadline`, `verifyEmailBody`,
      `verifyEmailResend`, `verifyEmailResent`, `verifyEmailWrongEmail` keys.

---

## Step 4 — Frontend: routing gate + SignUpScreen navigation

Outcome: authenticated users with `emailVerified = false` see `VerifyEmailScreen`; after
sign-up, navigation goes to `/verify-email`.

- [ ] `web/src/App.tsx`: in `rootElement()`, after the `!user` check add:
      `if (user && !user.emailVerified) return <VerifyEmailScreen />;`.
      Add `/verify-email` named route rendering `<VerifyEmailScreen />`.
- [ ] `web/src/screens/SignUpScreen/SignUpScreen.tsx`: after `authClient.signUp` succeeds,
      navigate to `/verify-email` (replace current `navigate('/', { replace: true })`).
- [ ] `web/src/auth/auth-client.ts`: verify `AuthUser` type includes `emailVerified:
      boolean` (mapped from better-auth session user type).

---

## Step 5 — Verification and cleanup

- [ ] Run `npm run test` in `proxy/` and `web/` — all tests pass.
- [ ] Run `npm run typecheck -w web` — no type errors.
- [ ] Manual smoke test (requires a real Resend API key in `.env`):
  - Sign up with email/password → redirected to `VerifyEmailScreen`.
  - Click "Resend" → confirmation shown, no duplicate error.
  - Click link in email → lands on `/` authenticated with `emailVerified = true` →
    routed to `EntryScreen` (if no `fplTeamId`) or `SquadScreen`.
  - Sign up with Google → no verification screen shown, straight to team ID gate.
  - Authenticated user with `emailVerified = false` navigating to `/history` → redirected
    to `VerifyEmailScreen`.
- [ ] `docs/architecture.md`: confirm Fly secrets table is up to date.
- [ ] Archive this OpenSpec change via `openspec-archive-change` once all steps pass.
