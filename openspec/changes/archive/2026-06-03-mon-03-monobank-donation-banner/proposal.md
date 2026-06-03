# Proposal: Monobank donation banner (MON-03)

## Problem

The app had no way for supporters to fund development. A zero-friction donation entry in the
always-visible team sidebar keeps the ask visible without blocking core FPL workflows.

## Solution

A **pinned footer banner** at the bottom of `TeamInfoPanel` (mobile drawer + desktop sidebar).
The banner uses an animated multi-token gradient, opens the Monobank jar in a new tab, and
defaults to the project jar URL with optional env overrides.

## Scope

### In

- `DonationBanner` component + `readDonationUrl()` (default jar, `VITE_DONATION_URL`,
  `VITE_DONATION_ENABLED=false`)
- Sidebar layout: scrollable body + fixed donation footer
- Copy in `copy.ts`
- Unit tests

### Out

- In-app payment processing
- Buy Me a Coffee / Stripe integrations

## Backlog

MON-03
