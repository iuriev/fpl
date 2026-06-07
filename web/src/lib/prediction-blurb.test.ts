import { describe, expect, it } from 'vitest';

import { buildPredictionBlurb } from '@/lib/prediction-blurb';
import type { FixtureInfo, PlayerGameweekPrediction } from '@/types';

function makePrediction(overrides: Partial<PlayerGameweekPrediction> = {}): PlayerGameweekPrediction {
  return {
    fplCode: 1,
    playerId: 1,
    event: 34,
    xPts: 6.0,
    xGoals: 0.4,
    xAssists: 0.2,
    csProb: null,
    defconPts: 0.1,
    confidence: 'medium',
    epNextAnchor: 5.5,
    modelXPts: 5.8,
    ...overrides,
  };
}

function makeFixture(overrides: Partial<FixtureInfo> = {}): FixtureInfo {
  return {
    gw: 34,
    opponent: 'AVL',
    home: true,
    difficulty: 2,
    ...overrides,
  };
}

describe('buildPredictionBlurb', () => {
  it('includes fixture, home/away, FDR and xPts', () => {
    const result = buildPredictionBlurb(makePrediction({ xPts: 7.4 }), 'MID', makeFixture());
    expect(result).toContain('AVL');
    expect(result).toContain('H');
    expect(result).toContain('FDR 2');
    expect(result).toContain('7.4 xPts');
  });

  it('shows away label for away fixture', () => {
    const result = buildPredictionBlurb(makePrediction(), 'FWD', makeFixture({ home: false }));
    expect(result).toContain('(A)');
  });

  it('appends CS chance for GK when csProb >= 0.35', () => {
    const result = buildPredictionBlurb(
      makePrediction({ csProb: 0.41 }),
      'GK',
      makeFixture(),
    );
    expect(result).toContain('CS chance 41%');
  });

  it('appends CS chance for DEF when csProb >= 0.35', () => {
    const result = buildPredictionBlurb(
      makePrediction({ csProb: 0.35 }),
      'DEF',
      makeFixture(),
    );
    expect(result).toContain('CS chance 35%');
  });

  it('does not append CS chance for MID even with high csProb', () => {
    const result = buildPredictionBlurb(
      makePrediction({ csProb: 0.9 }),
      'MID',
      makeFixture(),
    );
    expect(result).not.toContain('CS chance');
  });

  it('does not append CS chance when csProb is below threshold', () => {
    const result = buildPredictionBlurb(
      makePrediction({ csProb: 0.34 }),
      'DEF',
      makeFixture(),
    );
    expect(result).not.toContain('CS chance');
  });

  it('does not append CS chance when csProb is null', () => {
    const result = buildPredictionBlurb(makePrediction({ csProb: null }), 'DEF', makeFixture());
    expect(result).not.toContain('CS chance');
  });

  it('adds low confidence sentence when confidence is low', () => {
    const result = buildPredictionBlurb(
      makePrediction({ confidence: 'low' }),
      'MID',
      makeFixture(),
    );
    expect(result).toContain('Low confidence');
  });

  it('does not add confidence sentence for medium confidence', () => {
    const result = buildPredictionBlurb(
      makePrediction({ confidence: 'medium' }),
      'MID',
      makeFixture(),
    );
    expect(result).not.toContain('Low confidence');
  });

  it('does not add confidence sentence for high confidence', () => {
    const result = buildPredictionBlurb(
      makePrediction({ confidence: 'high' }),
      'MID',
      makeFixture(),
    );
    expect(result).not.toContain('Low confidence');
  });

  it('falls back gracefully when no fixture', () => {
    const result = buildPredictionBlurb(makePrediction({ xPts: 4.2 }), 'FWD', undefined);
    expect(result).toContain('4.2 xPts');
    expect(result).not.toContain('undefined');
    expect(result).not.toContain('null');
  });
});
