import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import * as queries from '@/api/queries';
import type { CalendarResponse } from '@/types';

import { FixturesCalendarScreen } from './FixturesCalendarScreen';

vi.mock('@/api/queries', () => ({
  useFixturesCalendar: vi.fn(),
}));

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

const mockQueries = vi.mocked(queries);

function makeTeam(id: number, shortName: string, name: string) {
  return {
    id,
    code: id * 10,
    name,
    shortName,
    strengthOverallHome: 1200,
    strengthOverallAway: 1150,
    strengthAttackHome: 1100,
    strengthAttackAway: 1050,
    strengthDefenceHome: 1200,
    strengthDefenceAway: 1150,
  };
}

const mockData: CalendarResponse = {
  teams: [makeTeam(1, 'ARS', 'Arsenal'), makeTeam(2, 'CHE', 'Chelsea')],
  gameweeks: [
    { id: 1, name: 'Gameweek 1', finished: true, isCurrent: false, deadline: '2025-08-09T11:00:00Z' },
    { id: 2, name: 'Gameweek 2', finished: false, isCurrent: true, deadline: '2025-08-16T11:00:00Z' },
  ],
  byTeam: {
    1: [
      {
        gw: 1,
        fixtures: [
          {
            opponentShortName: 'CHE',
            opponentId: 2,
            home: true,
            officialDifficulty: 3,
            overallDifficulty: 3,
            defensiveDifficulty: 4,
            attackingDifficulty: 2,
            kickoffTime: '2025-08-09T15:00:00Z',
            restDaysBefore: null,
          },
        ],
      },
      { gw: 2, fixtures: [] },
    ],
    2: [
      {
        gw: 1,
        fixtures: [
          {
            opponentShortName: 'ARS',
            opponentId: 1,
            home: false,
            officialDifficulty: 3,
            overallDifficulty: 3,
            defensiveDifficulty: 3,
            attackingDifficulty: 3,
            kickoffTime: '2025-08-09T15:00:00Z',
            restDaysBefore: null,
          },
          {
            opponentShortName: 'MCI',
            opponentId: 3,
            home: false,
            officialDifficulty: 5,
            overallDifficulty: 5,
            defensiveDifficulty: 5,
            attackingDifficulty: 5,
            kickoffTime: '2025-08-09T20:00:00Z',
            restDaysBefore: 0,
          },
        ],
      },
      {
        gw: 2,
        fixtures: [
          {
            opponentShortName: 'AVL',
            opponentId: 4,
            home: true,
            officialDifficulty: 2,
            overallDifficulty: 2,
            defensiveDifficulty: 2,
            attackingDifficulty: 2,
            kickoffTime: null,
            restDaysBefore: null,
          },
        ],
      },
    ],
  },
};

function renderScreen() {
  return render(
    <MemoryRouter>
      <FixturesCalendarScreen />
    </MemoryRouter>
  );
}

describe('FixturesCalendarScreen', () => {
  it('renders team names and GW header numbers from mock data', () => {
    mockQueries.useFixturesCalendar.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useFixturesCalendar>);

    renderScreen();

    expect(screen.getAllByText('ARS').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('CHE').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows all 5 tab labels', () => {
    mockQueries.useFixturesCalendar.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useFixturesCalendar>);

    renderScreen();

    expect(screen.getByRole('tab', { name: 'Official' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overall' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Defensive' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Attacking' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Rest Days' })).toBeInTheDocument();
  });

  it('Official tab is selected by default', () => {
    mockQueries.useFixturesCalendar.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useFixturesCalendar>);

    renderScreen();

    expect(screen.getByRole('tab', { name: 'Official' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Rest Days' })).toHaveAttribute('aria-selected', 'false');
  });

  it('switching to Rest Days tab shows TBC for null-kickoff fixture', async () => {
    const user = userEvent.setup();
    mockQueries.useFixturesCalendar.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useFixturesCalendar>);

    renderScreen();

    await user.click(screen.getByRole('tab', { name: 'Rest Days' }));

    expect(screen.getAllByText('TBC').length).toBeGreaterThanOrEqual(1);
  });

  it('DGW team renders two opponent chips in same column', () => {
    mockQueries.useFixturesCalendar.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useFixturesCalendar>);

    renderScreen();

    expect(screen.getByText('MCI')).toBeInTheDocument();
  });

  it('BGW renders dash placeholder', () => {
    mockQueries.useFixturesCalendar.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useFixturesCalendar>);

    renderScreen();

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows loading message when data is loading', () => {
    mockQueries.useFixturesCalendar.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useFixturesCalendar>);

    renderScreen();

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('opens help bottom sheet from header button', async () => {
    const user = userEvent.setup();
    mockQueries.useFixturesCalendar.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useFixturesCalendar>);

    renderScreen();

    await user.click(screen.getByRole('button', { name: 'Open help' }));

    expect(screen.getByRole('dialog', { name: 'Fixtures calendar guide' })).toBeInTheDocument();
    expect(screen.getByText('Fixture difficulty colours')).toBeInTheDocument();
    expect(screen.getByText('Very easy')).toBeInTheDocument();
    expect(screen.getByText('Rest days colours')).toBeInTheDocument();
  });

  it('closes help bottom sheet via backdrop', async () => {
    const user = userEvent.setup();
    mockQueries.useFixturesCalendar.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useFixturesCalendar>);

    renderScreen();

    await user.click(screen.getByRole('button', { name: 'Open help' }));
    await user.click(screen.getByTestId('bottom-sheet-backdrop'));

    expect(screen.queryByRole('dialog', { name: 'Fixtures calendar guide' })).not.toBeInTheDocument();
  });

  it('shows error message with retry button when request fails', () => {
    mockQueries.useFixturesCalendar.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useFixturesCalendar>);

    renderScreen();

    expect(screen.getByText('Unable to load fixtures. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
