import { describe, expect, it } from 'vitest';

import {
  displayPredictedXMins,
  hasLineupPlayRisk,
  PREDICTED_LINEUP_DISPLAY_XMINS_MIN,
} from './predicted-lineup-display';

describe('displayPredictedXMins', () => {
  it('floors values below the minimum', () => {
    expect(displayPredictedXMins(41)).toBe(PREDICTED_LINEUP_DISPLAY_XMINS_MIN);
  });

  it('leaves values at or above the minimum unchanged', () => {
    expect(displayPredictedXMins(60)).toBe(60);
    expect(displayPredictedXMins(90)).toBe(90);
  });
});

describe('hasLineupPlayRisk', () => {
  it('is true when injury or bench risk flags are set', () => {
    expect(hasLineupPlayRisk({ injuryWarning: true, benchRisk: false })).toBe(true);
    expect(hasLineupPlayRisk({ injuryWarning: false, benchRisk: true })).toBe(true);
    expect(hasLineupPlayRisk({ injuryWarning: false, benchRisk: false })).toBe(false);
  });
});
