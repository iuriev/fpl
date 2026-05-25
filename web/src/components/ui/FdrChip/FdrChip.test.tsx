import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FdrChip } from './FdrChip';

describe('FdrChip', () => {
  it('shows opponent abbreviation', () => {
    render(<FdrChip opponent="ARS" home={true} difficulty={2} />);
    expect(screen.getByText(/ARS/)).toBeInTheDocument();
  });

  it('shows H for home fixture', () => {
    render(<FdrChip opponent="MCI" home={true} difficulty={3} />);
    expect(screen.getByText(/H/)).toBeInTheDocument();
  });

  it('shows A for away fixture', () => {
    render(<FdrChip opponent="MCI" home={false} difficulty={3} />);
    expect(screen.getByText(/A/)).toBeInTheDocument();
  });

  it('applies correct background color for difficulty 5', () => {
    render(<FdrChip opponent="LIV" home={false} difficulty={5} />);
    const chip = screen.getByText(/LIV/).closest('[data-difficulty]') as HTMLElement;
    expect(chip?.dataset.difficulty).toBe('5');
  });
});
