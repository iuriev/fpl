# Proposal: Password Reset + Drawer Redesign (AUTH-04)

## Problem

AUTH-03 introduced email/password authentication but provided no recovery path for
forgotten passwords. Additionally, account actions (sign-out, change team) had no
permanent home in the UI: the `UserMenu` component existed but was never rendered, and the
"Change team" button lived in the `SquadScreen` header — an unintuitive location that
disappeared in guest mode.

A secondary cleanup: `VerifyEmailScreen` was a standalone route (`/verify-email`) that
duplicated the resend-verification-email flow already present as a BottomSheet inside
`SignInScreen`. It was unreachable from any navigation link in the app.

## Solution

**AUTH-04** adds a password reset flow and consolidates account actions into the side
drawer.

### Password reset flow

1. `SignInScreen` shows a "Forgot password?" link below the Sign In button, pointing to
   `/forgot-password`.
2. `ForgotPasswordScreen` — email field; on submit calls
   `POST /api/auth/request-password-reset` with `{ email, redirectTo }`. On success, shows
   an inline confirmation message (no navigation). On error, shows the API error message.
3. better-auth sends an email via Resend with a link to
   `/api/auth/reset-password/{token}?callbackURL=/reset-password`. Clicking it redirects
   the browser to `ResetPasswordScreen` with `?token=`.
4. `ResetPasswordScreen` — two password fields; validates match client-side; on submit
   calls `POST /api/auth/reset-password` with `{ token, newPassword }`. On success,
   navigates to `/sign-in` with `state: { passwordReset: true }`.
5. `SignInScreen` reads `location.state.passwordReset` and shows a one-time banner:
   "Password updated — sign in with your new password."

### Drawer redesign

The `TeamInfoPanel` (the side drawer) now shows a user identity block at the top when the
user is authenticated (`navLinksMode === 'full'`):

- Avatar initial + name + email
- "Sign out" button → `authClient.signOut()` + refetch + navigate to `/`
- "Change team →" row → navigate to `/entry`

Team name, manager name, and flag emoji moved from `TeamInfoPanel` to `SquadScreen`'s
drawer header, which already had a team info section.

### Cleanup

- `VerifyEmailScreen` deleted (3 files + route + export).
- `UserMenu` component deleted (3 files — was never rendered).
- "Change team" button removed from `SquadScreen` header (moved to drawer).

## Non-goals

- Password strength meter on `ResetPasswordScreen`.
- Ability to change password when already signed in.
- "Delete account" or other account management.
- Custom HTML email templates.
