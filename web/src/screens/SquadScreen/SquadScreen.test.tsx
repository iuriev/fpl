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

import { SquadScreen } from './SquadScreen';

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/?teamId=72828']}>
      <SquadScreen teamId={72828} />
    </MemoryRouter>
  );
}

function renderScreenWithState(state: Record<string, unknown>) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/', search: '?teamId=72828', state }]}>
      <SquadScreen teamId={72828} />
    </MemoryRouter>
  );
}

describe('SquadScreen header navigation', () => {
  it('shows Change button when no returnTo state (own team)', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back/i })).toBeNull();
  });

  it('shows Back button when returnTo state is present (guest mode)', () => {
    renderScreenWithState({ returnTo: '/watchlist?teamId=72828' });
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /change/i })).toBeNull();
  });

  it('shows Back button when returnTo is in sessionStorage (browser navigation)', () => {
    sessionStorage.setItem('fpl-guest-return-to', '/watchlist?teamId=72828');
    renderScreen();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    sessionStorage.removeItem('fpl-guest-return-to');
  });

  it('clears sessionStorage after reading returnTo', () => {
    sessionStorage.setItem('fpl-guest-return-to', '/watchlist?teamId=72828');
    renderScreen();
    expect(sessionStorage.getItem('fpl-guest-return-to')).toBeNull();
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
