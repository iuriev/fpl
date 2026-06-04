import { describe, expect, it } from 'vitest';

import { copy } from '@/lib/copy';
import type { PlayerProfileResponse } from '@/types';

import { buildAvailabilityAlerts } from './player-profile-alerts';

const basePlayer: PlayerProfileResponse['player'] = {
  id: 1,
  webName: 'Test',
  position: 'MID',
  teamCode: 1,
  teamShortName: 'TST',
  nowCost: 80,
  selectedByPercent: '10',
  status: 'a',
  news: '',
};

describe('buildAvailabilityAlerts', () => {
  it('shows predicted lineup injury warning when flagged', () => {
    const lines = buildAvailabilityAlerts(
      { ...basePlayer, status: 'd' },
      { injuryWarning: true, chanceOfPlaying: 50 }
    );
    expect(lines.some((l) => l.text === copy.predictedLineupsInjuryWarning)).toBe(true);
    expect(lines.some((l) => l.text.includes('50%'))).toBe(true);
  });

  it('shows FPL status when no lineup context', () => {
    const lines = buildAvailabilityAlerts(
      { ...basePlayer, status: 'd', news: 'Knock - 75% chance' },
      undefined
    );
    expect(lines.some((l) => l.text === copy.statusDoubtful)).toBe(true);
    expect(lines.some((l) => l.text.includes('Knock'))).toBe(true);
  });
});
