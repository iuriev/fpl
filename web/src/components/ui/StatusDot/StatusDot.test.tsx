import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusDot } from './StatusDot';

describe('StatusDot', () => {
  it('renders nothing for available status', () => {
    const { container } = render(<StatusDot status="a" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a warn dot for doubtful', () => {
    const { container } = render(<StatusDot status="d" />);
    expect((container.firstChild as HTMLElement).className).toContain('dot_warn');
  });

  it.each(['i', 's', 'u', 'n'] as const)('renders an error dot for status "%s"', (status) => {
    const { container } = render(<StatusDot status={status} />);
    expect((container.firstChild as HTMLElement).className).toContain('dot_error');
  });
});
