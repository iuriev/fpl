# Design: Email Verification (AUTH-03)

## Current implementation

- `proxy/src/auth/auth.ts` — `betterAuth` configured with `emailAndPassword.enabled = true`
  and Google `socialProviders`. No email verification plugin. `user.emailVerified` exists
  in the Drizzle schema (better-auth sets it to `false` on email signup, `true` on OAuth).
- `web/src/screens/SignUpScreen/SignUpScreen.tsx` — on success navigates to `/`, which
  routes to `EntryScreen` or `SquadScreen` (AUTH-02 will add the team-ID gate).
- `web/src/App.tsx` — no `emailVerified` check in routing (AUTH-02 routing landed; this
  change adds one more condition to the gate).

## Key decisions

1. **Use better-auth `emailVerification` plugin.** It manages the token lifecycle
   (generation, expiry, storage in the `verification` table already in the schema) and
   exposes a `sendVerificationEmail` callback we implement. No hand-rolled tokens.

2. **Resend as email transport.** Free tier (3 000 emails/month) is sufficient for early
   user base. The `resend` npm package has a minimal API. No additional SMTP server to
   manage. If we outgrow it, swapping the transport requires only changing the
   `sendVerificationEmail` implementation.

3. **Plain-text email for now.** An HTML template can be added later; a plain-text link
   is sufficient for verification and has zero design maintenance cost.

4. **`emailVerified` gate added to `rootElement()` in App.tsx.** The check fits naturally
   after the `user` check and before the `fplTeamId` check:
   ```
   user && !emailVerified → <VerifyEmailScreen />
   user && !fplTeamId    → <EntryScreen gate />
   user && fplTeamId     → <SquadScreen full />
   ```

5. **`VerifyEmailScreen` is stateless.** It reads the current user's email from
   `useCurrentUser()` and renders static copy. The "Resend" button calls
   `POST /api/auth/send-verification-email` (better-auth built-in endpoint). No local
   state beyond loading/error on the resend action.

## Backend changes

### `proxy/src/auth/auth.ts`

```ts
import { Resend } from 'resend';
import { emailVerification } from 'better-auth/plugins';

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  // ... existing config ...
  plugins: [
    emailVerification({
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await resend.emails.send({
          from: process.env.FROM_EMAIL ?? 'noreply@fpl-squad-viewer.fly.dev',
          to: user.email,
          subject: 'Verify your FPL Squad Viewer email',
          text: `Click the link to verify your email:\n\n${url}\n\nIf you didn't sign up, ignore this email.`,
        });
      },
    }),
  ],
});
```

`autoSignInAfterVerification: true` means clicking the link creates a session — user lands
on `/` already authenticated.

### `proxy/.env.example`

Add:
```
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com
```

## Frontend changes

### `web/src/screens/VerifyEmailScreen/VerifyEmailScreen.tsx`

```
State:
  resendLoading: boolean
  resendError: string | null
  resendSent: boolean

On mount: read user.email from useCurrentUser()

Render:
  - Headline: "Check your inbox"
  - Body: "We sent a verification link to <email>."
  - Resend button → POST /api/auth/send-verification-email (better-auth endpoint)
    - loading state during request
    - on success: show "Email sent!" confirmation
    - on error: show error message
  - "Wrong email? Sign up again" link → /sign-up
```

### `web/src/App.tsx` gate (addition to AUTH-02 work)

In `rootElement()`, after `!user` check, add:
```ts
if (user && !user.emailVerified) return <VerifyEmailScreen />;
```

### `web/src/screens/SignUpScreen/SignUpScreen.tsx`

After `authClient.signUp(...)` succeeds:
- Call `refetch()` to update auth state.
- Navigate to `/verify-email` (a named route so the screen is also reachable directly).

### Route `/verify-email`

Added to `App.tsx` as a named route rendering `<VerifyEmailScreen />`. Also handles the
return from the email link: better-auth's callback URL is `/` (configured in the plugin),
so the user re-enters the app at root with a fresh session and `emailVerified = true`.

## New npm dependency

`resend` — added to `proxy/package.json` (`dependencies`).

## sessionStorage / cookie interaction

No change — better-auth stores the verification token in the `verification` Postgres table.
The email link contains the raw token as a query param; better-auth validates it server-side.
