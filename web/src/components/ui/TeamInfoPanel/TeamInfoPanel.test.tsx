import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { fixtureEntry } from '@/fixtures';

import { TeamInfoPanel, TeamInfoPanelSkeleton } from './TeamInfoPanel';

function renderPanel(
  overrides: Partial<typeof fixtureEntry> = {},
  navLinksMode?: 'full' | 'hidden' | 'demo',
  showFollow = false
) {
  const entry = { ...fixtureEntry, ...overrides };
  return render(
    <MemoryRouter>
      <TeamInfoPanel entry={entry} teamId={entry.teamId} showFollow={showFollow} navLinksMode={navLinksMode} />
    </MemoryRouter>
  );
}

describe('TeamInfoPanel', () => {
  it('renders team name', () => {
    renderPanel();
    expect(screen.getByText('Amorim_out')).toBeInTheDocument();
  });

  it('renders manager name', () => {
    renderPanel();
    expect(screen.getByText(/Ivan Iuriev/)).toBeInTheDocument();
  });

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

  it('renders flag emoji when regionIsoCode is present', () => {
    renderPanel({ regionIsoCode: 'UA' });
    expect(screen.getByText('🇺🇦')).toBeInTheDocument();
  });

  it('omits flag when regionIsoCode is absent', () => {
    renderPanel({ regionIsoCode: undefined });
    expect(screen.queryByText('🇺🇦')).toBeNull();
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
    expect(screen.getByRole('link', { name: /GW History/i })).toBeInTheDocument();
  });

  it('full mode GW History link points to /history', () => {
    renderPanel({}, 'full');
    expect(screen.getByRole('link', { name: /GW History/i }).getAttribute('href')).toBe('/history');
  });

  it('hidden mode renders no nav links', () => {
    renderPanel({}, 'hidden');
    expect(screen.queryByRole('link', { name: /GW History/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /GW History/i })).toBeNull();
  });

  it('demo mode renders nav links as buttons', () => {
    renderPanel({}, 'demo');
    expect(screen.queryByRole('link', { name: /GW History/i })).toBeNull();
    expect(screen.getByRole('button', { name: /GW History/i })).toBeInTheDocument();
  });

  it('demo mode nav link button opens the sign-in dialog when clicked', () => {
    renderPanel({}, 'demo');
    const historyBtn = screen.getByRole('button', { name: /GW History/i });
    fireEvent.click(historyBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/sign in to unlock/i)).toBeInTheDocument();
  });

  it('defaults to full mode when navLinksMode is not specified', () => {
    renderPanel();
    expect(screen.getByRole('link', { name: /GW History/i })).toBeInTheDocument();
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
