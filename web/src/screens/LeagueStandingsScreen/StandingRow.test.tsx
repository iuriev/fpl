import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { StandingEntry } from '@/types';

import { StandingRow } from './StandingRow';

function makeStanding(overrides: Partial<StandingEntry> = {}): StandingEntry {
  return {
    entry: 123,
    entryName: 'Salah Fan FC',
    playerName: 'John Doe',
    rank: 2,
    lastRank: 3,
    total: 3245,
    eventTotal: 82,
    ...overrides,
  };
}

describe('StandingRow', () => {
  it('renders rank, player name, entry name, GW total, season total', () => {
    render(<StandingRow standing={makeStanding()} onClick={vi.fn()} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Salah Fan FC')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('3245')).toBeInTheDocument();
  });

  it('shows ↑ when rank improved', () => {
    render(<StandingRow standing={makeStanding({ rank: 2, lastRank: 5 })} onClick={vi.fn()} />);
    expect(screen.getByLabelText('up')).toHaveTextContent('↑');
  });

  it('shows ↓ when rank worsened', () => {
    render(<StandingRow standing={makeStanding({ rank: 5, lastRank: 2 })} onClick={vi.fn()} />);
    expect(screen.getByLabelText('down')).toHaveTextContent('↓');
  });

  it('shows — when rank unchanged', () => {
    render(<StandingRow standing={makeStanding({ rank: 3, lastRank: 3 })} onClick={vi.fn()} />);
    expect(screen.getByLabelText('neutral')).toHaveTextContent('—');
  });

  it('shows — when lastRank is null (newly joined)', () => {
    render(<StandingRow standing={makeStanding({ lastRank: null })} onClick={vi.fn()} />);
    expect(screen.getByLabelText('neutral')).toHaveTextContent('—');
  });

  it('calls onClick when button is pressed', async () => {
    const onClick = vi.fn();
    render(<StandingRow standing={makeStanding()} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
