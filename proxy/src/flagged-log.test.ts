import { afterEach, describe, expect, it } from 'vitest';

import { formatFlaggedPrefix } from './flagged-log';

function setStdoutTty(value: boolean | undefined): void {
  Object.defineProperty(process.stdout, 'isTTY', {
    configurable: true,
    value,
  });
}

describe('formatFlaggedPrefix', () => {
  const originalTty = process.stdout.isTTY;

  afterEach(() => {
    delete process.env.NO_COLOR;
    setStdoutTty(originalTty);
  });

  it('joins multiple tags without ANSI when not a TTY', () => {
    setStdoutTty(false);
    expect(
      formatFlaggedPrefix(['LINEUPS_SEED_ON_START', 'LINEUPS_WARMUP_ENABLED']),
    ).toBe('[seed] [lineups:warmup]');
  });

  it('formats a single tag without ANSI when NO_COLOR is set', () => {
    process.env.NO_COLOR = '1';
    setStdoutTty(true);
    expect(formatFlaggedPrefix('PREDICTIONS_WARMUP_ENABLED')).toBe('[predictions:warmup]');
  });

  it('wraps labels in ANSI color on a TTY', () => {
    delete process.env.NO_COLOR;
    setStdoutTty(true);
    const prefix = formatFlaggedPrefix('LINEUPS_WARMUP_ENABLED');
    expect(prefix).toContain('\x1b[36m');
    expect(prefix).toContain('[lineups:warmup]');
    expect(prefix).toContain('\x1b[0m');
  });
});
