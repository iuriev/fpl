# ADR 0003: Proxy framework — Hono

- Status: Accepted
- Date: 2026-05-21
- Deciders: ivan.iuriev, Claude

## Context

ADR 0001 established that we need a thin backend proxy in front of the public FPL API (the API
has no CORS and cannot be called from the browser). We need to pick a Node framework for that
proxy. The proxy is intentionally simple: receive a request, call the FPL API, cache, reshape,
return JSON. Constraints worth weighing: TypeScript-first project, solo developer, mobile-first
product, and a realistic chance of later deploying the proxy to a serverless/edge runtime or
migrating the whole app to Next.js (ADR 0001).

The realistic choices were **Express** (ubiquitous, huge ecosystem) and **Hono** (modern,
lightweight, TypeScript-native, runs across many runtimes).

## Decision

Use **Hono** for the proxy.

## Consequences

- (+) First-class TypeScript ergonomics — less type plumbing than Express.
- (+) Lightweight and fast, which suits a thin proxy with caching.
- (+) Portable across runtimes (Node, Bun, Deno, Cloudflare Workers, Vercel Edge), so a future
  move to edge/serverless or Next.js is low-friction.
- (−) Smaller ecosystem and fewer ready-made middleware/examples than Express. Acceptable: a
  thin proxy needs very little middleware.

## Alternatives considered

- **Express.** Rejected. Its main strength — a mature middleware ecosystem and ubiquity — is
  largely unneeded for a thin proxy, while its TypeScript ergonomics and edge/runtime
  portability are weaker than Hono's.
