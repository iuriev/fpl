import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ActiveChip } from '@/types';

import { ChipBadge } from './ChipBadge';

describe('ChipBadge', () => {
  it('renders nothing when chip is null', () => {
    const { container } = render(<ChipBadge chip={null} />);
    expect(container.firstChild).toBeNull();
  });

  it.each([
    ['wildcard', 'Wildcard'],
    ['3xc', 'Triple Captain'],
    ['freehit', 'Free Hit'],
    ['bboost', 'Bench Boost'],
  ] as [ActiveChip, string][])('renders label for %s chip', (chip, expectedLabel) => {
    render(<ChipBadge chip={chip} />);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it('has accessible role="status" and aria-label', () => {
    render(<ChipBadge chip="wildcard" />);
    expect(screen.getByRole('status', { name: /wildcard/i })).toBeInTheDocument();
  });

  it('renders an SVG icon for each chip', () => {
    (['wildcard', '3xc', 'freehit', 'bboost'] as ActiveChip[]).forEach((chip) => {
      const { container, unmount } = render(<ChipBadge chip={chip} />);
      expect(container.querySelector('svg')).not.toBeNull();
      unmount();
    });
  });
});
