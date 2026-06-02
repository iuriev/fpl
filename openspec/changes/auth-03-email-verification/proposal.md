# Proposal: Email Verification (AUTH-03)

## Problem

AUTH-01 introduced email + password sign-up but users are never asked to verify their
email address. Anyone can register with an arbitrary email (including one they don't own),
and accounts with unverified emails are immediately fully functional. This creates two
concrete risks:

1. **Ownership ambiguity.** A malicious actor could register with someone else's email,
   locking that person out of creating their own account.
2. **Dead email → no recovery path.** Without verification, password-reset emails are sent
   to unconfirmed addresses and silently discarded. Users with typos in their email have
   no recovery option.

Google OAuth sign-ups are exempt — Google has already verified the address.

## Solution

**AUTH-03** adds mandatory email verification for email/password sign-ups, powered by
[better-auth's `emailVerification` plugin](https://www.better-auth.com/docs/plugins/email-verification)
and [Resend](https://resend.com/) as the email transport (free tier: 3 000 emails/month).

### Flow

1. User submits the sign-up form.
2. Backend creates the account (unverified) and sends a verification email via Resend
   containing a verification link.
3. Frontend redirects to `VerifyEmailScreen` — "We sent you a link, check your inbox."
   A **Resend** button is available (rate-limited by better-auth).
4. User clicks the link in the email → browser opens
   `/api/auth/verify-email?token=<token>&callbackURL=/`.
5. better-auth verifies the token and marks `emailVerified = true`.
6. User is redirected to `/` → the auth gate continues: if no `fplTeamId` → `EntryScreen`,
   otherwise `SquadScreen`.

### Gate

Until `user.emailVerified === true`, every authenticated route redirects to
`/verify-email`. The gate is enforced in the new `AuthAndTeamProtectedRoute` introduced in
AUTH-02 and in the root `rootElement()` logic.

Google OAuth sign-ups bypass the gate — `emailVerified` is set to `true` by better-auth
automatically for OAuth providers.

## User value

- "I signed up with my email and want to start using the app" — they verify in one tap,
  then land on the team ID entry screen.
- "I made a typo in my email" — the verification screen explains the issue and lets them
  see the address they registered with, so they know to sign up again.
- "I signed in with Google" — no extra step, same as today.

## Scope

### In

- `proxy/src/auth/auth.ts`: enable `emailVerification` plugin; configure
  `sendVerificationEmail` to send via Resend SDK.
- `proxy/.env.example`: add `RESEND_API_KEY`, `FROM_EMAIL`.
- `proxy/src/auth/auth.test.ts`: test that `sendVerificationEmail` is called on signup.
- `web/src/screens/VerifyEmailScreen/`: new screen shown after email/password sign-up and
  when `!user.emailVerified`.
- `web/src/App.tsx` (AUTH-02 routing): add `emailVerified` check to the auth gate — if
  `user && !user.emailVerified` → `<VerifyEmailScreen />`.
- `web/src/screens/SignUpScreen/SignUpScreen.tsx`: after successful signup, navigate to
  `/verify-email` instead of `/`.
- `web/src/lib/copy.ts`: add `verifyEmail*` copy keys.
- `docs/architecture.md`: add `RESEND_API_KEY` and `FROM_EMAIL` to the Fly secrets table.

### Out

- Password reset flow (future change).
- Email change flow (future change).
- Custom email templates / branded HTML emails (future change — use plain-text for now).
