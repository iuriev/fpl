import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { copy } from '@/lib/copy';

import { PremiumUpsellDialog } from './PremiumUpsellDialog';

describe('PremiumUpsellDialog', () => {
  it('renders transfer copy when open', () => {
    render(<PremiumUpsellDialog open variant="transfer" onClose={() => {}} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(copy.premiumUpsellTransferTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.premiumUpsellTransferBenefit1)).toBeInTheDocument();
  });

  it('renders predictions copy', () => {
    render(<PremiumUpsellDialog open variant="predictions" onClose={() => {}} />);
    expect(screen.getByText(copy.premiumUpsellPredictionsTitle)).toBeInTheDocument();
  });

  it('calls onClose when primary CTA is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PremiumUpsellDialog open variant="transfer" onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: copy.premiumUpsellCta }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when dismiss text is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PremiumUpsellDialog open variant="transfer" onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: copy.premiumUpsellDismiss }));
    expect(onClose).toHaveBeenCalled();
  });
});
