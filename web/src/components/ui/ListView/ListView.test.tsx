import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { fixtureSquad } from '@/fixtures';
import type { SquadPlayer } from '@/types';

import { ListView } from './ListView';

describe('ListView', () => {
  it('renders all five section headers', () => {
    render(<ListView starters={fixtureSquad.starters} bench={fixtureSquad.bench} />);
    expect(screen.getByText('Goalkeeper')).toBeInTheDocument();
    expect(screen.getByText('Defenders')).toBeInTheDocument();
    expect(screen.getByText('Midfielders')).toBeInTheDocument();
    expect(screen.getByText('Forwards')).toBeInTheDocument();
    expect(screen.getByText('Bench')).toBeInTheDocument();
  });

  it('renders all 15 players', () => {
    render(<ListView starters={fixtureSquad.starters} bench={fixtureSquad.bench} />);
    for (const p of [...fixtureSquad.starters, ...fixtureSquad.bench]) {
      expect(screen.getByText(p.name)).toBeInTheDocument();
    }
  });

  it('shows a status dot for an injured player', () => {
    const { container } = render(<ListView starters={fixtureSquad.starters} bench={fixtureSquad.bench} />);
    expect(container.querySelector('[class*="dot_error"]')).toBeInTheDocument();
  });

  it('shows a captain badge', () => {
    render(<ListView starters={fixtureSquad.starters} bench={fixtureSquad.bench} />);
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('renders an em-dash for null stat values', () => {
    const starters: SquadPlayer[] = fixtureSquad.starters.map(p => ({
      ...p,
      stats: { ...p.stats, goals_scored: null as unknown as number },
    }));
    render(<ListView starters={starters} bench={fixtureSquad.bench} />);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('applies muted style to zero stat cells', () => {
    const { container } = render(<ListView starters={fixtureSquad.starters} bench={fixtureSquad.bench} />);
    expect(container.querySelector('[class*="statCell_zero"]')).toBeInTheDocument();
  });
});
