import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { CalendarFixture } from '@/types';

import { FixtureCell } from './FixtureCell';

function makeFixture(overrides: Partial<CalendarFixture> = {}): CalendarFixture {
  return {
    opponentShortName: 'MCI',
    opponentId: 43,
    home: true,
    officialDifficulty: 4,
    overallDifficulty: 3,
    defensiveDifficulty: 5,
    attackingDifficulty: 2,
    kickoffTime: '2025-10-05T15:00:00Z',
    restDaysBefore: 7,
    ...overrides,
  };
}

describe('FixtureCell', () => {
  describe('FDR mode', () => {
    it('renders opponent name and H/A for a normal fixture', () => {
      render(<FixtureCell fixtures={[makeFixture()]} mode="official" isDgwCol={false} />);
      expect(screen.getByText('MCI')).toBeInTheDocument();
      expect(screen.getByText('H')).toBeInTheDocument();
    });

    it('renders away indicator', () => {
      render(
        <FixtureCell fixtures={[makeFixture({ home: false })]} mode="official" isDgwCol={false} />
      );
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('applies fdr5 class for official difficulty 5', () => {
      const { container } = render(
        <FixtureCell fixtures={[makeFixture({ officialDifficulty: 5 })]} mode="official" isDgwCol={false} />
      );
      expect(container.querySelector('[class*="fdr5"]')).toBeInTheDocument();
    });

    it('applies overallDifficulty class in overall mode', () => {
      const { container } = render(
        <FixtureCell
          fixtures={[makeFixture({ overallDifficulty: 2 })]}
          mode="overall"
          isDgwCol={false}
        />
      );
      expect(container.querySelector('[class*="fdr2"]')).toBeInTheDocument();
    });

    it('applies defensiveDifficulty class in defensive mode', () => {
      const { container } = render(
        <FixtureCell
          fixtures={[makeFixture({ defensiveDifficulty: 5 })]}
          mode="defensive"
          isDgwCol={false}
        />
      );
      expect(container.querySelector('[class*="fdr5"]')).toBeInTheDocument();
    });

    it('renders two chips for a DGW', () => {
      render(
        <FixtureCell
          fixtures={[makeFixture({ opponentShortName: 'ARS' }), makeFixture({ opponentShortName: 'CHE' })]}
          mode="official"
          isDgwCol={true}
        />
      );
      expect(screen.getByText('ARS')).toBeInTheDocument();
      expect(screen.getByText('CHE')).toBeInTheDocument();
    });

    it('renders BGW dash for empty fixtures', () => {
      render(<FixtureCell fixtures={[]} mode="official" isDgwCol={false} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('Rest Days mode', () => {
    it('renders rest days count', () => {
      render(
        <FixtureCell fixtures={[makeFixture({ restDaysBefore: 3 })]} mode="restDays" isDgwCol={false} />
      );
      expect(screen.getByText('3d')).toBeInTheDocument();
    });

    it('renders TBC when kickoffTime is null', () => {
      render(
        <FixtureCell
          fixtures={[makeFixture({ kickoffTime: null, restDaysBefore: null })]}
          mode="restDays"
          isDgwCol={false}
        />
      );
      expect(screen.getByText('TBC')).toBeInTheDocument();
    });

    it('applies tight colour class for 0–3 days', () => {
      const { container } = render(
        <FixtureCell fixtures={[makeFixture({ restDaysBefore: 2 })]} mode="restDays" isDgwCol={false} />
      );
      expect(container.querySelector('[class*="restTight"]')).toBeInTheDocument();
    });

    it('applies moderate colour class for 4–6 days', () => {
      const { container } = render(
        <FixtureCell fixtures={[makeFixture({ restDaysBefore: 5 })]} mode="restDays" isDgwCol={false} />
      );
      expect(container.querySelector('[class*="restModerate"]')).toBeInTheDocument();
    });

    it('applies easy colour class for 7+ days', () => {
      const { container } = render(
        <FixtureCell fixtures={[makeFixture({ restDaysBefore: 10 })]} mode="restDays" isDgwCol={false} />
      );
      expect(container.querySelector('[class*="restEasy"]')).toBeInTheDocument();
    });

    it('applies tbc colour class for null rest days', () => {
      const { container } = render(
        <FixtureCell
          fixtures={[makeFixture({ restDaysBefore: null })]}
          mode="restDays"
          isDgwCol={false}
        />
      );
      expect(container.querySelector('[class*="restTbc"]')).toBeInTheDocument();
    });
  });
});
