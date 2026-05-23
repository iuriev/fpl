import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PositionBadge } from './PositionBadge';

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'] as const;

describe('PositionBadge', () => {
  it.each(POSITIONS)('renders the %s label', (pos) => {
    render(<PositionBadge position={pos} />);
    expect(screen.getByText(pos)).toBeInTheDocument();
  });

  it.each(POSITIONS)('applies position-specific class for %s', (pos) => {
    const { container } = render(<PositionBadge position={pos} />);
    expect((container.firstChild as HTMLElement).className).toContain(`badge_${pos}`);
  });
});
