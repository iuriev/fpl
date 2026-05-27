import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { fixtureDreamTeam, fixtureGameweeks } from '@/fixtures';

vi.mock('@/api/queries', () => ({
  useGameweeks: () => ({ data: fixtureGameweeks }),
  useDreamTeam: () => ({ data: fixtureDreamTeam, isLoading: false, isError: false, error: null, refetch: vi.fn() }),
}));

import { DreamTeamScreen } from './DreamTeamScreen';

function renderScreen(path = '/dream-team?gw=36') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DreamTeamScreen />
    </MemoryRouter>,
  );
}

describe('DreamTeamScreen', () => {
  it('renders the Dream Team heading', () => {
    renderScreen();
    expect(screen.getByText('Dream Team')).toBeInTheDocument();
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

  it('renders a back button', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: /squad/i })).toBeInTheDocument();
  });

  it('renders prev/next gameweek nav buttons', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: /previous gameweek/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next gameweek/i })).toBeInTheDocument();
  });

  it('prev button is disabled when on GW 1', () => {
    renderScreen('/dream-team?gw=1');
    expect(screen.getByRole('button', { name: /previous gameweek/i })).toBeDisabled();
  });
});


describe('DreamTeamScreen not-available state', () => {
  it('shows not-available message for an unfinished gameweek', () => {
    renderScreen('/dream-team?gw=37');
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument();
  });
});
