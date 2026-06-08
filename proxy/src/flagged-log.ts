export type StartupFlagTag =
  | 'LINEUPS_SEED_ON_START'
  | 'LINEUPS_WARMUP_ENABLED'
  | 'PREDICTIONS_WARMUP_ENABLED';

const TAG_CONFIG: Record<StartupFlagTag, { label: string; color: string }> = {
  LINEUPS_SEED_ON_START: { label: 'seed', color: '\x1b[33m' },
  LINEUPS_WARMUP_ENABLED: { label: 'lineups:warmup', color: '\x1b[36m' },
  PREDICTIONS_WARMUP_ENABLED: { label: 'predictions:warmup', color: '\x1b[35m' },
};

const RESET = '\x1b[0m';

function normalizeTags(tags: StartupFlagTag | StartupFlagTag[]): StartupFlagTag[] {
  return Array.isArray(tags) ? tags : [tags];
}

function useColor(): boolean {
  return process.env.NO_COLOR == null && process.stdout.isTTY === true;
}

export function formatFlaggedPrefix(tags: StartupFlagTag | StartupFlagTag[]): string {
  const list = normalizeTags(tags);
  if (list.length === 0) return '';
  const colored = useColor();
  return list
    .map((tag) => {
      const { label, color } = TAG_CONFIG[tag];
      return colored ? `${color}[${label}]${RESET}` : `[${label}]`;
    })
    .join(' ');
}

function write(
  level: 'log' | 'warn' | 'error',
  tags: StartupFlagTag | StartupFlagTag[],
  message: string,
  ...args: unknown[]
): void {
  const prefix = formatFlaggedPrefix(tags);
  const line = prefix ? `${prefix} ${message}` : message;
  console[level](line, ...args);
}

export function flaggedLog(
  tags: StartupFlagTag | StartupFlagTag[],
  message: string,
  ...args: unknown[]
): void {
  write('log', tags, message, ...args);
}

export function flaggedWarn(
  tags: StartupFlagTag | StartupFlagTag[],
  message: string,
  ...args: unknown[]
): void {
  write('warn', tags, message, ...args);
}

export function flaggedError(
  tags: StartupFlagTag | StartupFlagTag[],
  message: string,
  ...args: unknown[]
): void {
  write('error', tags, message, ...args);
}

export function createFlaggedLogger(tags: StartupFlagTag | StartupFlagTag[]) {
  const list = normalizeTags(tags);
  return {
    log: (message: string, ...args: unknown[]) => write('log', list, message, ...args),
    warn: (message: string, ...args: unknown[]) => write('warn', list, message, ...args),
    error: (message: string, ...args: unknown[]) => write('error', list, message, ...args),
  };
}

export const seedFlagLog = createFlaggedLogger('LINEUPS_SEED_ON_START');
export const lineupsWarmupFlagLog = createFlaggedLogger('LINEUPS_WARMUP_ENABLED');
export const predictionsWarmupFlagLog = createFlaggedLogger('PREDICTIONS_WARMUP_ENABLED');
