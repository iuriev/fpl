# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build   # compile TypeScript to dist/
```

## Architecture

Minimal TypeScript project. Source lives in `src/`, compiled output goes to `dist/` (CommonJS, ES2016 target). Entry point is `src/index.ts`.

No test runner or linter is configured yet.