import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('applies primary variant by default', () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole('button')).toHaveClass('primary');
  });

  it('disables when disabled prop is true', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Click</Button>);
    expect(screen.getByRole('button')).toHaveClass('secondary');
  });

  it('applies link variant', () => {
    render(<Button variant="link">Click</Button>);
    expect(screen.getByRole('button')).toHaveClass('link');
  });

  it('applies pill variant', () => {
    render(<Button variant="pill">Click</Button>);
    expect(screen.getByRole('button')).toHaveClass('pill');
  });

  it('sets aria-busy when loading', () => {
    render(<Button loading>Click</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
