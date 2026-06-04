const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

export type FplFetchPriority = 'interactive' | 'background';

interface QueueEntry<T> {
  path: string;
  priority: FplFetchPriority;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

const queue: QueueEntry<unknown>[] = [];
let draining = false;
let lastFetchAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function minGapMs(priority: FplFetchPriority): number {
  if (priority === 'interactive') return 100;
  const raw = process.env.LINEUPS_WARMUP_INTERVAL_MS;
  const parsed = raw ? parseInt(raw, 10) : 5000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
}

function insertQueueEntry<T>(path: string, priority: FplFetchPriority, entry: QueueEntry<T>): void {
  if (priority === 'interactive') {
    const firstBackground = queue.findIndex((q) => q.priority === 'background');
    if (firstBackground === -1) {
      queue.push(entry as QueueEntry<unknown>);
    } else {
      queue.splice(firstBackground, 0, entry as QueueEntry<unknown>);
    }
  } else {
    queue.push(entry as QueueEntry<unknown>);
  }
}

function enqueue<T>(path: string, priority: FplFetchPriority): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    insertQueueEntry(path, priority, { path, priority, resolve, reject });
    queueMicrotask(() => {
      void drainQueue();
    });
  });
}

export function enqueueFplFetchForTests(path: string, priority: FplFetchPriority): void {
  insertQueueEntry(path, priority, {
    path,
    priority,
    resolve: () => {},
    reject: () => {},
  });
}

async function fetchDirect<T>(path: string): Promise<T> {
  const url = `${FPL_BASE_URL}${path}`;
  const t0 = Date.now();
  const response = await fetch(url);
  const ms = Date.now() - t0;
  console.log(`[fpl] ${new Date().toISOString()} ${response.status} ${ms}ms ${path}`);
  if (!response.ok) {
    throw new Error(`FPL API error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

async function drainQueue(): Promise<void> {
  if (draining) return;
  draining = true;
  while (queue.length > 0) {
    const item = queue.shift()!;
    const gap = minGapMs(item.priority);
    const wait = Math.max(0, lastFetchAt + gap - Date.now());
    if (wait > 0) await sleep(wait);
    try {
      const data = await fetchDirect(item.path);
      item.resolve(data);
    } catch (err) {
      item.reject(err);
    }
    lastFetchAt = Date.now();
  }
  draining = false;
}

export function scheduleFplFetch<T>(
  path: string,
  priority: FplFetchPriority = 'interactive'
): Promise<T> {
  return enqueue<T>(path, priority);
}

export function resetFplRequestQueueForTests(): void {
  queue.length = 0;
  draining = false;
  lastFetchAt = 0;
}

export function getFplQueueDepth(): number {
  return queue.length;
}

export function peekQueuePathsForTests(): string[] {
  return queue.map((q) => q.path);
}
