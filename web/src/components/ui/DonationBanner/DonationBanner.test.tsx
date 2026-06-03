import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as readDonationUrlModule from '@/lib/donation/readDonationUrl';

import { DonationBanner } from './DonationBanner';

describe('DonationBanner', () => {
  it('renders nothing when donation URL is not configured', () => {
    vi.spyOn(readDonationUrlModule, 'readDonationUrl').mockReturnValue(null);
    const { container } = render(<DonationBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('links to the Monobank jar in a new tab', () => {
    vi.spyOn(readDonationUrlModule, 'readDonationUrl').mockReturnValue(
      'https://send.monobank.ua/jar/7UQvnCDwx8'
    );
    render(<DonationBanner />);
    const link = screen.getByRole('link', { name: /support the project/i });
    expect(link).toHaveAttribute('href', 'https://send.monobank.ua/jar/7UQvnCDwx8');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
