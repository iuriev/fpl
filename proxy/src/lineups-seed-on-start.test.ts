import { afterEach, describe, expect, it, vi } from 'vitest';

import { isLineupsSeedOnStartEnabled, maybeRunLineupsSeedOnStart } from './lineups-seed-on-start';

const { spawnMock } = vi.hoisted(() => ({
  spawnMock: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  spawn: spawnMock,
}));

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

  it('runs Transfermarkt ingest when enabled', async () => {
    process.env.LINEUPS_SEED_ON_START = 'true';
    spawnMock.mockImplementation(() => ({
      on(event: string, cb: (code?: number) => void) {
        if (event === 'exit') cb(0);
      },
    }));

    await maybeRunLineupsSeedOnStart();

    expect(spawnMock).toHaveBeenCalledTimes(1);
    const args = spawnMock.mock.calls[0];
    expect(String(args[1]?.[1] ?? '')).toContain('ingest-transfermarkt-positions.ts');
  });

  it('skips spawn when disabled', async () => {
    await maybeRunLineupsSeedOnStart();
    expect(spawnMock).not.toHaveBeenCalled();
  });
});
