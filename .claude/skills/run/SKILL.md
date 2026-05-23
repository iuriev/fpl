н---
name: run
description: Launch the FPL app (proxy + web) for local development and verify it's working.
---

## Architecture

Two servers must run simultaneously:

| Service | Port | Command | Directory |
|---------|------|---------|-----------|
| Hono proxy | 3001 | `npm run dev` | `proxy/` |
| Vite web | 3000 | `npm run dev` | `web/` |

Vite at 3000 proxies `/api/*` → `localhost:3001` (Hono) → FPL API.

`npm run --workspaces dev` at the repo root does NOT work: npm runs workspaces sequentially, so Vite blocks and the proxy never starts.

## Launch sequence

**Step 1 — check for stray processes**

```bash
lsof -nP -i :3000 -i :3001 | grep LISTEN
```

For each port:
- 3001 running `tsx` → proxy already up, skip
- 3001 running `vite` → stray, kill it: `kill <pid>`
- 3000 running `vite --config .../web/vite.config.ts` → web already up, skip
- 3000 running anything else → stray, kill it

**Step 2 — start missing services in background**

If proxy not running:
```bash
cd /path/to/repo/proxy && npm run dev > /tmp/fpl-proxy.log 2>&1 &
sleep 3 && cat /tmp/fpl-proxy.log
```

If web not running:
```bash
cd /path/to/repo/web && npm run dev > /tmp/fpl-web.log 2>&1 &
sleep 4 && cat /tmp/fpl-web.log
```

Confirm Vite says `ready` and is on port 3000 (not a fallback port). If it picked a different port, 3000 is still occupied — find and kill whatever is there, restart.

**Step 3 — smoke test**

```bash
curl -s http://localhost:3000/api/entry/72828
```

Expected: JSON with `teamId`, `teamName`, `managerName`, etc.

- `EAGAIN` → proxy not running (back to step 1)
- `502 Bad Gateway` → proxy running but failing — check `/tmp/fpl-proxy.log`
- JSON response → both services healthy

## Teardown

```bash
kill $(lsof -nP -i :3000 -i :3001 | grep LISTEN | awk '{print $2}')
```