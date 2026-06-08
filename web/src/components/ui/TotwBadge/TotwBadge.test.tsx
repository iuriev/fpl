import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { copy } from '@/lib/copy';

import { TotwBadge } from './TotwBadge';

describe('TotwBadge', () => {
  it('renders with Team of the Week aria label', () => {
    render(<TotwBadge />);
    expect(screen.getByLabelText(copy.teamOfTheWeekPlayerBadge)).toBeInTheDocument();
  });
});
