import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'docs/investor/screenshots');
const baseUrl = process.env.INVESTOR_BASE_URL ?? 'http://localhost:3000';
const teamId = process.env.FPL_TEAM_ID ?? '72828';
const email =
  process.env.INVESTOR_SCREENSHOT_EMAIL ?? 'investor-capture@screenshot.local';
const password = process.env.INVESTOR_SCREENSHOT_PASSWORD ?? 'InvestorCapture2026!';

const routes = [
  { name: '01-squad', path: '/', caption: 'Squad view — pitch layout, chips, live GW context' },
  { name: '02-transfers', path: '/transfers', caption: 'Transfer planner — budget, chips, swap planning' },
  { name: '03-fixtures', path: '/fixtures', caption: 'Fixtures calendar — FDR, DGW/BGW, recovery view' },
  { name: '04-price-changes', path: '/price-changes', caption: 'Price changes — actual movers and tonight predictions' },
  { name: '05-predicted-points', path: '/predicted-points', caption: 'Predicted points — ranked by expected points' },
  { name: '06-gameweek-review', path: '/review', caption: 'Gameweek review — what worked, transfers, what-if' },
  { name: '07-stats', path: '/stats', caption: 'My stats — leagues and gameweek history' },
  { name: '08-leaderboard', path: '/leaderboard', caption: 'DEFCON / BPS leaderboard' },
  { name: '09-watchlist', path: '/watchlist', caption: 'Manager watchlist — track rivals' },
  { name: '10-player-watchlist', path: '/player-watchlist', caption: 'Player watchlist — shortlist before transfers' },
];

function waitForUrl(url, timeoutMs = 120_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      fetch(url)
        .then((r) => {
          if (r.ok || r.status === 304) resolve();
          else if (Date.now() - start > timeoutMs) reject(new Error(`Timeout waiting for ${url}`));
          else setTimeout(tick, 1500);
        })
        .catch(() => {
          if (Date.now() - start > timeoutMs) reject(new Error(`Timeout waiting for ${url}`));
          else setTimeout(tick, 1500);
        });
    };
    tick();
  });
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: root, stdio: 'inherit', ...opts });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function ensureAuth(request) {
  let signIn = await request.post(`${baseUrl}/api/auth/sign-in/email`, {
    data: { email, password },
  });

  if (!signIn.ok()) {
    const signUp = await request.post(`${baseUrl}/api/auth/sign-up/email`, {
      data: { email, password, name: 'Investor Capture' },
    });
    if (!signUp.ok() && signUp.status() !== 422) {
      throw new Error(`Sign-up failed: ${signUp.status()} ${await signUp.text()}`);
    }
    await run('npx', ['tsx', '--env-file=proxy/.env', 'scripts/investor/verify-screenshot-user.ts', email, teamId]);
    signIn = await request.post(`${baseUrl}/api/auth/sign-in/email`, {
      data: { email, password },
    });
  }

  if (!signIn.ok()) {
    throw new Error(`Sign-in failed: ${signIn.status()} ${await signIn.text()}`);
  }
}

async function dismissBlockingUi(page) {
  await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('fpl_premium_upsell'));
    for (const k of keys) localStorage.setItem(k, String(Date.now()));
    localStorage.setItem('fpl-help-tour-transfer-seen', '1');
  });

  const skip = page.getByRole('button', { name: /skip/i });
  if (await skip.isVisible().catch(() => false)) await skip.click();

  const dismiss = page.getByRole('button', { name: /dismiss|close|✕/i }).first();
  if (await dismiss.isVisible().catch(() => false)) await dismiss.click();
}

async function prepareTeam(page) {
  if (!page.url().includes('/entry')) return;
  await page.locator('input[type="text"], input:not([type="password"])').first().fill(teamId);
  await page.getByRole('button', { name: /view squad/i }).click();
  await page.waitForURL((u) => !u.pathname.includes('/entry'), { timeout: 30_000 });
}

fs.mkdirSync(outDir, { recursive: true });

const startDev = process.env.INVESTOR_SKIP_DEV !== '1';
let devProc;

if (startDev) {
  devProc = spawn('npm', ['run', 'dev'], { cwd: root, stdio: 'pipe', detached: true });
  devProc.unref();
}

try {
  await waitForUrl(baseUrl);
  await waitForUrl(`${baseUrl}/api/health`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: 'en-GB',
  });
  const page = await context.newPage();

  await ensureAuth(context.request);
  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  if (page.url().includes('/sign-in')) {
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL((u) => !u.pathname.includes('/sign-in'), { timeout: 30_000 });
  }

  await prepareTeam(page);
  await dismissBlockingUi(page);

  for (const route of routes) {
    await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await dismissBlockingUi(page);
    await page.locator('[aria-busy="true"]').waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => {});
    await page.waitForTimeout(2500);
    await page.screenshot({
      path: path.join(outDir, `${route.name}.png`),
      fullPage: false,
    });
    console.log(`Captured ${route.name}.png`);
  }

  fs.writeFileSync(
    path.join(outDir, 'captions.json'),
    JSON.stringify(
      routes.map((r) => ({ file: `${r.name}.png`, caption: r.caption })),
      null,
      2,
    ),
  );

  await browser.close();
} finally {
  if (devProc?.pid) {
    try {
      process.kill(-devProc.pid, 'SIGTERM');
    } catch {
      /* already stopped */
    }
  }
}
