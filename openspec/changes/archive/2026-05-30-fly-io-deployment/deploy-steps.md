# Fly.io Deploy — Remaining Steps

Code is ready and Docker image is verified. Run these commands to go live.

## Progress so far

- [x] 1. Hono static file serving (`proxy/src/index.ts`)
- [x] 2. `tsx` moved to production deps, `start` script added (`proxy/package.json`)
- [x] 3. `Dockerfile` + `.dockerignore` created and verified locally
- [x] 4. `fly.toml` created (`app = fpl-squad-viewer`, region `lhr`, no sleep)
- [ ] 5. Deploy to Fly.io
- [ ] 6. Post-deploy docs update

---

## Step 5 — Deploy

Run these commands one by one in the repo root.

### 5.1 Install flyctl

```bash
brew install flyctl
```

### 5.2 Log in

```bash
fly auth login
```

Opens a browser. Log in or create a free Fly.io account.

### 5.3 Register the app (one time only)

```bash
fly launch --no-deploy
```

- If asked "Would you like to copy its configuration to the new app?" → **y**
- If asked to overwrite `fly.toml` → **n** (keep ours)
- Accept the `fpl-squad-viewer` app name (or pick another — update `fly.toml` to match)

### 5.4 Deploy

```bash
fly deploy
```

Builds the Docker image remotely on Fly.io and deploys. Takes ~2 min on first run.

### 5.5 Verify

```bash
fly open
```

Opens `https://fpl-squad-viewer.fly.dev` in the browser. Check:
- App loads
- Enter a team ID and verify squad data appears
- Open DevTools → Network → confirm `/api/gameweeks` returns 200

---

## Step 6 — Post-deploy (after Step 5 is done)

Run `/opsx:apply fly-io-deployment` to complete the remaining tasks:
- 6.1 Record live URL in `docs/architecture.md`
- 6.2 Promote `INF-01` and `INF-02` to P0 in `docs/backlog.md`

---

## Useful fly commands

```bash
fly status                  # check machine status
fly logs                    # tail live logs
fly ssh console             # SSH into the running machine
fly deploy                  # redeploy after code changes
```
