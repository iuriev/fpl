## ADDED Requirements

### Requirement: Configure upsell frequency via frontend environment

The system SHALL read premium upsell settings from Vite environment variables at build time and
use them for all cooldown decisions.

#### Scenario: Default cooldown is 24 hours

- **WHEN** `VITE_PREMIUM_UPSELL_COOLDOWN_MS` is unset or not a valid non-negative integer
- **THEN** the effective cooldown is 86400000 milliseconds (24 hours)

#### Scenario: Custom cooldown from environment

- **WHEN** `VITE_PREMIUM_UPSELL_COOLDOWN_MS` is set to a valid non-negative integer
- **THEN** that value is used as the minimum time between upsell displays per screen

#### Scenario: Upsell globally disabled

- **WHEN** `VITE_PREMIUM_UPSELL_ENABLED` is `'false'`
- **THEN** no automatic premium upsell dialog is shown on any screen

### Requirement: Show blocking upsell dialog to free-tier users on Transfer

The system SHALL display a centered blocking modal dialog on the Transfer screen when a
free-tier user views a loaded squad and the per-screen cooldown has elapsed.

#### Scenario: Dialog on eligible visit

- **WHEN** the user is not premium, upsell is enabled, the Transfer squad has loaded
  successfully, and the transfer-screen cooldown has elapsed
- **THEN** a modal dialog is shown with transfer-specific headline, lead, three benefits, and a
  premium value line

#### Scenario: Premium user never sees dialog

- **WHEN** the user's `subscriptionTier` is `premium` (or dev override marks them premium)
- **THEN** the upsell dialog is not shown on Transfer

#### Scenario: No dialog while loading or errored

- **WHEN** the Transfer screen is loading squad data, failed to load, or has no squad to display
- **THEN** the upsell dialog is not shown

#### Scenario: Dialog blocks underlying content

- **WHEN** the upsell dialog is open
- **THEN** the user cannot interact with the Transfer screen behind it until the dialog is closed

### Requirement: Cooldown starts on dismiss

The system SHALL record the dismiss time per screen when the user closes the upsell dialog and
SHALL not show that screen's dialog again until the configured cooldown has passed.

#### Scenario: Dismiss via secondary action

- **WHEN** the user activates «Not this gameweek»
- **THEN** the dialog closes and the transfer-screen last-shown timestamp is set to the current time

#### Scenario: Dismiss via close control or backdrop

- **WHEN** the user closes the dialog via the close button or backdrop click
- **THEN** the dialog closes and the transfer-screen last-shown timestamp is set to the current time

#### Scenario: Cooldown respected on return

- **WHEN** the user opens Transfer again before the cooldown has elapsed since the last dismiss
- **THEN** the upsell dialog is not shown

#### Scenario: Cooldown expired

- **WHEN** the user opens Transfer after the cooldown has elapsed since the last dismiss
- **THEN** the upsell dialog may be shown again if other eligibility rules pass

### Requirement: Primary CTA closes without navigation

The system SHALL close the upsell dialog when the user activates the primary CTA and SHALL NOT
navigate to another route or open a payment flow until MON-01 is implemented.

#### Scenario: Get Premium closes modal

- **WHEN** the user activates «Get Premium»
- **THEN** the dialog closes, the transfer-screen last-shown timestamp is updated, and the user
  remains on the Transfer screen

### Requirement: Predictions screen hook (deferred)

The system SHALL support a `predictions` upsell variant with predictions-specific copy and an
independent cooldown key, wired when the Predicted Points screen (PRED-02) ships.

#### Scenario: Predictions variant copy ready

- **WHEN** `requestUpsell('predictions')` is invoked under the same eligibility rules as Transfer
- **THEN** the dialog shows predictions-specific headline and benefits (implementation may ship
  with PRED-02)

### Requirement: Expose subscription tier on session

The system SHALL expose the user's `subscriptionTier` (`free` | `premium`) on `GET /api/me` so the
client can suppress upsell for paying users.

#### Scenario: Free tier default

- **WHEN** a user has no explicit premium assignment in the database
- **THEN** `GET /api/me` returns `subscriptionTier: 'free'`

#### Scenario: Premium tier

- **WHEN** a user's `subscription_tier` in the database is `premium`
- **THEN** `GET /api/me` returns `subscriptionTier: 'premium'` and upsell dialogs are suppressed
