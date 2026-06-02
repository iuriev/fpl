import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { fixtureEntry } from '@/fixtures';

import { TeamInfoPanel } from './TeamInfoPanel';

function renderPanel(overrides: Partial<typeof fixtureEntry> = {}, showFollow = false) {
  const entry = { ...fixtureEntry, ...overrides };
  return render(
    <MemoryRouter>
      <TeamInfoPanel entry={entry} teamId={entry.teamId} showFollow={showFollow} />
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

  it('renders Gameweek History link', () => {
    renderPanel();
    expect(screen.getByRole('link', { name: /Gameweek History/i })).toBeInTheDocument();
  });

  it('Gameweek History link points to /history with teamId', () => {
    renderPanel();
    const link = screen.getByRole('link', { name: /Gameweek History/i });
    expect(link.getAttribute('href')).toBe('/history?teamId=72828');
  });

  it('does not render Follow button by default (own team)', () => {
    renderPanel();
    expect(screen.queryByRole('button', { name: /follow/i })).toBeNull();
  });

  it('renders Follow button when showFollow=true (guest mode)', () => {
    renderPanel({}, true);
    expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument();
  });
});
