import { afterEach, describe, expect, it, vi } from 'vitest';

const { spawnMock } = vi.hoisted(() => ({
  spawnMock: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  spawn: spawnMock,
}));

import { isLineupsSeedOnStartEnabled, maybeRunLineupsSeedOnStart } from './lineups-seed-on-start';

describe('lineups-seed-on-start', () => {
  afterEach(() => {
    delete process.env.LINEUPS_SEED_ON_START;
    spawnMock.mockReset();
  });

  it('is disabled unless env is exactly true', () => {
    expect(isLineupsSeedOnStartEnabled()).toBe(false);
    process.env.LINEUPS_SEED_ON_START = '1';
    expect(isLineupsSeedOnStartEnabled()).toBe(false);
    process.env.LINEUPS_SEED_ON_START = 'true';
    expect(isLineupsSeedOnStartEnabled()).toBe(true);
  });

  it('runs both seed scripts when enabled', async () => {
    process.env.LINEUPS_SEED_ON_START = 'true';
    spawnMock.mockImplementation(() => ({
      on(event: string, cb: (code?: number) => void) {
        if (event === 'exit') cb(0);
      },
    }));

    await maybeRunLineupsSeedOnStart();

    expect(spawnMock).toHaveBeenCalledTimes(2);
    const scripts = spawnMock.mock.calls.map((c) => String(c[1][0]));
    expect(scripts.some((p) => p.endsWith('seed-player-tactical-roles.mjs'))).toBe(true);
    expect(scripts.some((p) => p.endsWith('seed-player-lanes.mjs'))).toBe(true);
  });

  it('skips spawn when disabled', async () => {
    await maybeRunLineupsSeedOnStart();
    expect(spawnMock).not.toHaveBeenCalled();
  });
});
