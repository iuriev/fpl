import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CapInlineBadge } from './CapInlineBadge';

describe('CapInlineBadge', () => {
  it('renders C for captain', () => {
    render(<CapInlineBadge cap="C" />);
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('renders V for vice-captain', () => {
    render(<CapInlineBadge cap="V" />);
    expect(screen.getByText('V')).toBeInTheDocument();
  });

  it('renders nothing for null', () => {
    const { container } = render(<CapInlineBadge cap={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for undefined', () => {
    const { container } = render(<CapInlineBadge cap={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('applies captain class for C', () => {
    const { container } = render(<CapInlineBadge cap="C" />);
    expect((container.firstChild as HTMLElement).className).toContain('badge_captain');
  });

  it('applies vice class for V', () => {
    const { container } = render(<CapInlineBadge cap="V" />);
    expect((container.firstChild as HTMLElement).className).toContain('badge_vice');
  });
});
