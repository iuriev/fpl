import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { fixtureEntry, fixtureGameweeks } from '@/fixtures';

vi.mock('@/api/queries', () => ({
  useEntry: () => ({ data: fixtureEntry, isError: false }),
  useGameweeks: () => ({ data: fixtureGameweeks }),
  useSquad: () => ({ data: null, isLoading: false, isError: false, error: null, refetch: vi.fn() }),
  usePlayerPool: () => ({ data: null }),
}));

import { MyTeamProvider } from '@/lib/my-team/MyTeamProvider';

import { SquadScreen } from './SquadScreen';

function renderScreen(isGuest?: boolean, state?: Record<string, unknown>) {
  return render(
    <MemoryRouter initialEntries={state ? [{ pathname: '/', search: '?teamId=72828', state }] : ['/?teamId=72828']}>
      <MyTeamProvider>
        <SquadScreen teamId={72828} isGuest={isGuest} />
      </MyTeamProvider>
    </MemoryRouter>
  );
}

describe('SquadScreen header navigation', () => {
  it('shows Change button when no returnTo state (own team)', () => {
    renderScreen(false);
    expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back/i })).toBeNull();
  });

  it('shows Back button when isGuest=true (guest mode)', () => {
    renderScreen(true, { returnTo: '/watchlist?teamId=72828' });
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /change/i })).toBeNull();
  });

  it('shows Back button when returnTo is in location state', () => {
    renderScreen(true, { returnTo: '/watchlist?teamId=72828' });
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });
});

describe('SquadScreen drawer', () => {
  it('renders a burger button in the header', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: /open team info/i })).toBeInTheDocument();
  });

  it('drawer is closed on initial render', () => {
    renderScreen();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('clicking the burger button opens the drawer', async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.click(screen.getByRole('button', { name: /open team info/i }));
    expect(screen.getByRole('dialog', { name: /team information/i })).toBeInTheDocument();
  });

  it('clicking the backdrop closes the drawer', async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.click(screen.getByRole('button', { name: /open team info/i }));
    await user.click(screen.getByTestId('drawer-backdrop'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
