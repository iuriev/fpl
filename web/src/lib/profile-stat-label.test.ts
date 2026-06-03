import { describe, expect, it } from 'vitest';

import { profileStatLabel } from './profile-stat-label';

describe('profileStatLabel', () => {
  it('formats goals plural', () => {
    expect(profileStatLabel('goals_scored', 2)).toBe('2 goals');
    expect(profileStatLabel('goals_scored', 1)).toBe('1 goal');
  });

  it('formats minutes', () => {
    expect(profileStatLabel('minutes', 90)).toBe('90 mins');
  });
});
