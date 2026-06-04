## ADDED Requirements

### Requirement: Monobank donation banner in team sidebar

The system SHALL show a donation banner pinned to the bottom of the team info sidebar
(`TeamInfoPanel`) on all screens that use the team navigation drawer.

#### Scenario: Banner links to Monobank jar

- **WHEN** donation is enabled and a valid donation URL is configured
- **THEN** the banner displays support copy and links to that URL
- **AND** the link opens in a new browsing context with `rel="noopener noreferrer"`

#### Scenario: Default jar URL

- **WHEN** `VITE_DONATION_URL` is unset
- **THEN** the banner uses the built-in Monobank jar URL for this project

#### Scenario: Donation disabled

- **WHEN** `VITE_DONATION_ENABLED` is `'false'`
- **THEN** the donation banner is not rendered

#### Scenario: Banner stays at sidebar bottom

- **WHEN** the sidebar has more nav links than fit on screen
- **THEN** the main panel content scrolls
- **AND** the donation banner remains visible at the bottom of the sidebar viewport

### Requirement: Accessible motion

The donation banner SHALL respect `prefers-reduced-motion` by disabling gradient animation
when the user prefers reduced motion.
