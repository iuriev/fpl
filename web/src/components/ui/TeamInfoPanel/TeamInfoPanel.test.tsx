import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as authClientModule from '@/auth/auth-client';
import { AuthContext, type AuthContextValue } from '@/auth/AuthContext';
import { fixtureEntry } from '@/fixtures';
import * as readDonationUrlModule from '@/lib/donation/readDonationUrl';

import { TeamInfoPanel, TeamInfoPanelSkeleton } from './TeamInfoPanel';

vi.mock('@/auth/auth-client');

const nullAuthCtx: AuthContextValue = { user: null, loading: false, refetch: vi.fn() };

function renderPanel(
  overrides: Partial<typeof fixtureEntry> = {},
  navLinksMode?: 'full' | 'hidden' | 'demo',
  showFollow = false
) {
  const entry = { ...fixtureEntry, ...overrides };
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={nullAuthCtx}>
        <TeamInfoPanel entry={entry} teamId={entry.teamId} showFollow={showFollow} navLinksMode={navLinksMode} />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

const mockUser = {
  id: '1',
  email: 'ivan.iuriev@gmail.com',
  name: 'Ivan Iuriev',
  fplTeamId: 72828,
  emailVerified: true,
};
const mockRefetch = vi.fn();

function renderPanelWithUser(
  overrides: Partial<typeof fixtureEntry> = {},
  navLinksMode: 'full' | 'hidden' | 'demo' = 'full',
  user: AuthContextValue['user'] = mockUser
) {
  const entry = { ...fixtureEntry, ...overrides };
  const authCtx: AuthContextValue = { user, loading: false, refetch: mockRefetch };
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authCtx}>
        <TeamInfoPanel entry={entry} teamId={entry.teamId} navLinksMode={navLinksMode} />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('TeamInfoPanel', () => {
  it('renders overall points formatted', () => {
    renderPanel({ overallPoints: 2156 });
    expect(screen.getByText('2,156')).toBeInTheDocument();
  });

  it('renders overall rank formatted', () => {
    renderPanel({ overallRank: 142857 });
    expect(screen.getByText('142,857')).toBeInTheDocument();
  });

  it('renders GW points', () => {
    renderPanel({ eventPoints: 67 });
    expect(screen.getByText('67')).toBeInTheDocument();
  });

  it('renders total players formatted', () => {
    renderPanel({ totalPlayers: 10500000 });
    expect(screen.getByText('10,500,000')).toBeInTheDocument();
  });

  it('does not render Follow button by default (own team)', () => {
    renderPanel();
    expect(screen.queryByRole('button', { name: /follow/i })).toBeNull();
  });

  it('renders Follow button when showFollow=true (guest mode)', () => {
    renderPanel({}, undefined, true);
    expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument();
  });
});

describe('TeamInfoPanel — navLinksMode', () => {
  it('full mode renders nav links as <Link> elements', () => {
    renderPanel({}, 'full');
    expect(screen.getByRole('link', { name: /My Squad/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /My GW history/i })).toBeInTheDocument();
  });

  it('full mode My Squad link points to /', () => {
    renderPanel({}, 'full');
    expect(screen.getByRole('link', { name: /My Squad/i }).getAttribute('href')).toBe('/');
  });

  it('full mode GW History link points to /history', () => {
    renderPanel({}, 'full');
    expect(screen.getByRole('link', { name: /My GW history/i }).getAttribute('href')).toBe('/history');
  });

  it('hidden mode renders no nav links', () => {
    renderPanel({}, 'hidden');
    expect(screen.queryByRole('link', { name: /My GW history/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /My GW history/i })).toBeNull();
  });

  it('demo mode renders nav links as buttons', () => {
    renderPanel({}, 'demo');
    expect(screen.queryByRole('link', { name: /My GW history/i })).toBeNull();
    expect(screen.getByRole('button', { name: /My GW history/i })).toBeInTheDocument();
  });

  it('demo mode nav link button opens the sign-in dialog when clicked', () => {
    renderPanel({}, 'demo');
    const historyBtn = screen.getByRole('button', { name: /My GW history/i });
    fireEvent.click(historyBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/sign in to unlock/i)).toBeInTheDocument();
  });

  it('defaults to full mode when navLinksMode is not specified', () => {
    renderPanel();
    expect(screen.getByRole('link', { name: /My GW history/i })).toBeInTheDocument();
  });
});

describe('TeamInfoPanel — user block', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows user name and email in full mode', () => {
    renderPanelWithUser();
    expect(screen.getByText('Ivan Iuriev')).toBeInTheDocument();
    expect(screen.getByText('ivan.iuriev@gmail.com')).toBeInTheDocument();
  });

  it('shows Sign out button in full mode', () => {
    renderPanelWithUser();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('shows Change team button in full mode', () => {
    renderPanelWithUser();
    expect(screen.getByRole('button', { name: /change team/i })).toBeInTheDocument();
  });

  it('does not show user block in demo mode', () => {
    renderPanelWithUser({}, 'demo');
    expect(screen.queryByRole('button', { name: /sign out/i })).toBeNull();
  });

  it('does not show user block in hidden mode', () => {
    renderPanelWithUser({}, 'hidden');
    expect(screen.queryByRole('button', { name: /sign out/i })).toBeNull();
  });

  it('does not show user block when user is null', () => {
    renderPanelWithUser({}, 'full', null);
    expect(screen.queryByRole('button', { name: /sign out/i })).toBeNull();
  });

  it('calls signOut and refetch on Sign out click', async () => {
    const mockSignOut = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(authClientModule, 'authClient', 'get').mockReturnValue({
      ...authClientModule.authClient,
      signOut: mockSignOut,
    });

    renderPanelWithUser();
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
    await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
  });
});

describe('TeamInfoPanel — donation banner', () => {
  it('shows donation link when URL is configured', () => {
    vi.spyOn(readDonationUrlModule, 'readDonationUrl').mockReturnValue(
      'https://send.monobank.ua/jar/7UQvnCDwx8'
    );
    renderPanel();
    expect(screen.getByRole('link', { name: /support the project/i })).toBeInTheDocument();
  });

  it('hides donation banner when URL is not configured', () => {
    vi.spyOn(readDonationUrlModule, 'readDonationUrl').mockReturnValue(null);
    renderPanel();
    expect(screen.queryByRole('link', { name: /support the project/i })).toBeNull();
  });
});

describe('TeamInfoPanelSkeleton', () => {
  it('renders with aria-busy and aria-label', () => {
    render(<MemoryRouter><TeamInfoPanelSkeleton /></MemoryRouter>);
    const el = screen.getByRole('complementary');
    expect(el).toHaveAttribute('aria-busy', 'true');
    expect(el).toHaveAttribute('aria-label', 'Loading...');
  });
});
