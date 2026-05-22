---
name: feedback-no-screenshot-tests
description: Screenshot QA gate dropped; no qa-tester agent, no mandatory Storybook stories as gate
metadata:
  type: feedback
---

Screenshot tests and the `qa-tester` hard gate were dropped (ADR 0012, 2026-05-22). Do not suggest or add screenshot testing workflows.

**Why:** Added friction to each development iteration without proportional benefit.

**How to apply:** Storybook stays as a dev/catalog tool; stories are optional. The only automated test layer is Vitest + RTL. Visual review happens in the browser during development.
