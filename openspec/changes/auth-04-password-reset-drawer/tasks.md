# Tasks: Password Reset + Drawer Redesign (AUTH-04)

**Depends on:** AUTH-03 (email/password auth + Resend setup) must be complete.

---

## Step 1 — Cleanup: remove unused files and Change team header button

- [x] Delete `web/src/screens/VerifyEmailScreen/` (3 files).
- [x] Delete `web/src/components/ui/UserMenu/` (3 files).
- [x] `web/src/screens/index.ts`: remove `VerifyEmailScreen` export.
- [x] `web/src/App.tsx`: remove `/verify-email` route.
- [x] `web/src/screens/SquadScreen/SquadScreen.tsx`: remove `handleChangeTeam` function and
      the "Change team" `<Button variant="link">` from the header (both normal and error
      states). Keep `useNavigate` — used elsewhere.
- [x] `web/src/lib/copy.ts`: remove `squadChangeTeam` key (now orphaned).

---

## Step 2 — Copy strings

- [x] `web/src/lib/copy.ts`: add keys for `ForgotPasswordScreen` (`forgotPassword*`),
      `ResetPasswordScreen` (`resetPassword*`), `SignInScreen` additions
      (`signInForgotPassword`, `signInPasswordResetBanner`), and drawer actions
      (`drawerChangeTeam`, `drawerSignOut`).

---

## Step 3 — Backend: wire up password reset in better-auth

- [x] `proxy/src/auth/auth.ts`: add `sendResetPassword` (note: not `sendResetPasswordEmail`)
      and `resetPasswordTokenExpiresIn: 3600` to the `emailAndPassword` block. Handler sends
      email via Resend with the reset URL.
- [x] `proxy/.env.example`: `RESEND_API_KEY` and `FROM_EMAIL` already documented in AUTH-03.

---

## Step 4 — authClient: add password reset methods

- [x] `web/src/auth/auth-client.ts`:
  - `requestPasswordReset(email)` → `POST /api/auth/request-password-reset`
    with `{ email, redirectTo: window.location.origin + '/reset-password' }`.
  - `resetPassword(token, newPassword)` → `POST /api/auth/reset-password`
    with `{ token, newPassword }`.

---

## Step 5 — ForgotPasswordScreen

- [x] `web/src/screens/ForgotPasswordScreen/ForgotPasswordScreen.tsx`: idle / submitted /
      error states; calls `authClient.requestPasswordReset`; shows inline success, no
      navigation; "Back to Sign In" link always visible.
- [x] `web/src/screens/ForgotPasswordScreen/ForgotPasswordScreen.module.css`: mirrors
      SignInScreen layout, all `--fpl-*` tokens.
- [x] `web/src/screens/ForgotPasswordScreen/ForgotPasswordScreen.test.tsx`: 5 tests.
- [x] `web/src/screens/index.ts`: export `ForgotPasswordScreen`.

---

## Step 6 — ResetPasswordScreen

- [x] `web/src/screens/ResetPasswordScreen/ResetPasswordScreen.tsx`: reads `?token=` from
      URL; shows error + link to `/forgot-password` when no token; two password fields with
      client-side mismatch validation; calls `authClient.resetPassword`; navigates to
      `/sign-in` with `state: { passwordReset: true }` on success.
- [x] `web/src/screens/ResetPasswordScreen/ResetPasswordScreen.module.css`.
- [x] `web/src/screens/ResetPasswordScreen/ResetPasswordScreen.test.tsx`: 6 tests including
      navigation assertion.
- [x] `web/src/screens/index.ts`: export `ResetPasswordScreen`.

---

## Step 7 — SignInScreen: Forgot password link + success banner

- [x] `web/src/screens/SignInScreen/SignInScreen.tsx`:
  - Add `passwordReset?: boolean` to `LocationState`.
  - Show `copy.signInPasswordResetBanner` banner before headline when
    `location.state.passwordReset === true`.
  - Add `<Link to="/forgot-password">` between `</form>` and the divider.
- [x] `web/src/screens/SignInScreen/SignInScreen.module.css`: add `.forgotLink` styles.
- [x] `web/src/screens/SignInScreen/SignInScreen.test.tsx`: 2 new tests.

---

## Step 8 — Routes

- [x] `web/src/App.tsx`: add `<Route path="/forgot-password" element={<ForgotPasswordScreen />} />`
      and `<Route path="/reset-password" element={<ResetPasswordScreen />} />` (both
      public, no auth guard).

---

## Step 9 — Drawer: TeamInfoPanel user block

- [x] `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.tsx`:
  - Move team identity (name, manager, flag) to `SquadScreen`'s `drawerHeader` JSX;
    remove `isoToFlag`, `flag`, avatar, and identity blocks from `TeamInfoPanel`.
  - Add `useCurrentUser()` + `useNavigate()`.
  - Render user block (avatar initial, name, email, Sign out button, Change team button)
    only when `navLinksMode === 'full' && user`.
  - `handleSignOut`: `authClient.signOut()` → `refetch()` → `navigate('/', replace)`.
  - `handleChangeTeam`: `navigate('/entry')`.
- [x] `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.module.css`: add `.userBlock`,
      `.userAvatar`, `.userInfo`, `.userName`, `.userEmail`, `.signOutBtn`,
      `.changeTeamRow` styles; remove old avatar/identity styles.
- [x] `web/src/components/ui/TeamInfoPanel/TeamInfoPanel.test.tsx`:
  - Remove 4 tests for team name, manager, flag (moved to SquadScreen).
  - Update `renderPanel` to wrap with `AuthContext.Provider` (user: null).
  - Add `renderPanelWithUser` helper.
  - Add 7 tests for the user block.
- [x] `web/src/screens/SquadScreen/SquadScreen.tsx`: add `isoToFlag` + team name/manager
      display to `drawerHeader`; add `.teamNameRow` / `.teamManager` CSS.

---

## Step 10 — Verification and cleanup

- [x] `npm run test -w web` — 376 tests pass.
- [x] `npm run test -w proxy` — 287 tests pass.
- [ ] Manual smoke test (requires running proxy + Resend key):
  - "Forgot password?" link visible on `SignInScreen`.
  - Submit `ForgotPasswordScreen` → success message shown, no navigation.
  - Email arrives with reset link; clicking it lands on `ResetPasswordScreen?token=`.
  - Submit matching passwords → redirected to `SignInScreen` with success banner.
  - Submit mismatched passwords → inline error, no API call made.
  - Open `/reset-password` with no token → error message + link to `/forgot-password`.
  - Authenticated user: Sign out button in drawer → signs out, redirects to `/`.
  - Authenticated user: "Change team →" in drawer → navigates to `/entry`.
- [ ] Archive this OpenSpec change via `openspec-archive-change` once all steps pass.
