import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AuthContext, type AuthContextValue } from '@/auth/AuthContext';
import { fixtureEntry } from '@/fixtures';
import * as readDonationUrlModule from '@/lib/donation/readDonationUrl';

import { TeamInfoPanel, TeamInfoPanelSkeleton } from './TeamInfoPanel';

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
  subscriptionTier: 'free' as const,
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
    expect(screen.getByRole('link', { name: /My Stats/i })).toBeInTheDocument();
  });

  it('full mode My Squad link points to /', () => {
    renderPanel({}, 'full');
    expect(screen.getByRole('link', { name: /My Squad/i }).getAttribute('href')).toBe('/');
  });

  it('full mode My Stats link points to /stats', () => {
    renderPanel({}, 'full');
    expect(screen.getByRole('link', { name: /My Stats/i }).getAttribute('href')).toBe('/stats');
  });

  it('does not render a separate My GW history nav link', () => {
    renderPanel({}, 'full');
    expect(screen.queryByRole('link', { name: /My GW history/i })).toBeNull();
  });

  it('hidden mode renders no nav links', () => {
    renderPanel({}, 'hidden');
    expect(screen.queryByRole('link', { name: /My Stats/i })).toBeNull();
  });

  it('demo mode renders nav links as buttons', () => {
    renderPanel({}, 'demo');
    expect(screen.queryByRole('link', { name: /My Stats/i })).toBeNull();
    expect(screen.getByRole('button', { name: /My Stats/i })).toBeInTheDocument();
  });

  it('demo mode nav link button opens the sign-in dialog when clicked', () => {
    renderPanel({}, 'demo');
    const statsBtn = screen.getByRole('button', { name: /My Stats/i });
    fireEvent.click(statsBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/sign in to unlock/i)).toBeInTheDocument();
  });

  it('defaults to full mode when navLinksMode is not specified', () => {
    renderPanel();
    expect(screen.getByRole('link', { name: /My Stats/i })).toBeInTheDocument();
  });
});

describe('TeamInfoPanel — settings link', () => {
  it('does not show Settings nav link in full mode', () => {
    renderPanelWithUser();
    expect(screen.queryByRole('link', { name: /settings/i })).toBeNull();
  });

  it('does not show account profile in the side panel', () => {
    renderPanelWithUser();
    expect(screen.queryByText('Ivan Iuriev')).toBeNull();
    expect(screen.queryByText('ivan.iuriev@gmail.com')).toBeNull();
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
