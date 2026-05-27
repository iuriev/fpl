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
