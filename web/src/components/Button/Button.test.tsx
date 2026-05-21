import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveTextContent('Click me');
  });

  it('applies primary variant by default', () => {
    const { container } = render(<Button>Click</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('primary');
  });

  it('disables when disabled prop is true', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies secondary variant', () => {
    const { container } = render(<Button variant="secondary">Click</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('secondary');
  });

  it('applies link variant', () => {
    const { container } = render(<Button variant="link">Click</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('link');
  });

  it('applies pill variant', () => {
    const { container } = render(<Button variant="pill">Click</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('pill');
  });

  it('sets aria-busy when loading', () => {
    render(<Button loading>Click</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
