import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { fixtureDreamTeam, fixtureGameweeks } from '@/fixtures';

vi.mock('@/api/queries', () => ({
  useGameweeks: () => ({ data: fixtureGameweeks }),
  useTeamOfTheWeek: () => ({
    data: fixtureDreamTeam,
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

import { TeamOfTheWeekScreen } from './TeamOfTheWeekScreen';

function renderScreen(path = '/team-of-the-week?gw=36') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TeamOfTheWeekScreen />
    </MemoryRouter>
  );
}

describe('TeamOfTheWeekScreen', () => {
  it('renders the Team of the Week heading', () => {
    renderScreen();
    expect(screen.getByText('Team of the Week')).toBeInTheDocument();
  });

  it('renders the gameweek label', () => {
    renderScreen();
    expect(screen.getByText('GW 36')).toBeInTheDocument();
  });

  it('renders 11 player names from the fixture', () => {
    renderScreen();
    expect(screen.getByText('Raya')).toBeInTheDocument();
    expect(screen.getByText('Haaland')).toBeInTheDocument();
    expect(screen.getByText('Trossard')).toBeInTheDocument();
  });

  it('renders a menu button', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: /open team info/i })).toBeInTheDocument();
  });

  it('renders prev/next gameweek nav buttons', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: /previous gameweek/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next gameweek/i })).toBeInTheDocument();
  });

  it('prev button is disabled when on GW 1', () => {
    renderScreen('/team-of-the-week?gw=1');
    expect(screen.getByRole('button', { name: /previous gameweek/i })).toBeDisabled();
  });
});

describe('TeamOfTheWeekScreen not-available state', () => {
  it('shows not-available message for an unfinished gameweek', () => {
    renderScreen('/team-of-the-week?gw=37');
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument();
  });
});
