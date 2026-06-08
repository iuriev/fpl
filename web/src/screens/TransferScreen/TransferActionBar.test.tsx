import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { copy } from '@/lib/copy';

import { TransferActionBar } from './TransferActionBar';

const mockRequestPremiumUpsell = vi.fn();

vi.mock('@/lib/premium-upsell/PremiumUpsellContext', () => ({
  useRequestPremiumUpsell: () => mockRequestPremiumUpsell,
}));

let mockIsPremium = false;
vi.mock('@/lib/use-premium-status', () => ({
  usePremiumStatus: () => mockIsPremium,
}));

const defaultProps = {
  onOpenTransfers: vi.fn(),
  onReset: vi.fn(),
  onSave: vi.fn(),
  onAiFreeHit: vi.fn(),
  hasSwaps: false,
  hasChanges: false,
  isDirty: false,
  isAiLoading: false,
  freehitAvailable: true,
};

describe('TransferActionBar', () => {
  it('renders existing action buttons', () => {
    render(<TransferActionBar {...defaultProps} />);
    expect(screen.getByText(copy.transfersTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.transfersReset)).toBeInTheDocument();
    expect(screen.getByText(copy.transfersSavePlan)).toBeInTheDocument();
  });

  it('renders AI row buttons', () => {
    render(<TransferActionBar {...defaultProps} />);
    expect(screen.getByText(copy.aiFreehitButton)).toBeInTheDocument();
    expect(screen.getByText(copy.aiWildcardButton)).toBeInTheDocument();
  });

  it('AI Wildcard is always disabled', () => {
    render(<TransferActionBar {...defaultProps} />);
    expect(screen.getByText(copy.aiWildcardButton)).toBeDisabled();
  });

  it('AI Free Hit triggers upsell for non-premium users', async () => {
    mockIsPremium = false;
    const user = userEvent.setup();
    render(<TransferActionBar {...defaultProps} />);
    await user.click(screen.getByText(copy.aiFreehitButton));
    expect(mockRequestPremiumUpsell).toHaveBeenCalledWith('transfer');
    expect(defaultProps.onAiFreeHit).not.toHaveBeenCalled();
  });

  it('AI Free Hit calls onAiFreeHit for premium users when available', async () => {
    mockIsPremium = true;
    const user = userEvent.setup();
    render(<TransferActionBar {...defaultProps} freehitAvailable={true} />);
    await user.click(screen.getByText(copy.aiFreehitButton));
    expect(defaultProps.onAiFreeHit).toHaveBeenCalled();
  });

  it('AI Free Hit is disabled for premium users when freehit already played', () => {
    mockIsPremium = true;
    render(<TransferActionBar {...defaultProps} freehitAvailable={false} />);
    expect(screen.getByText(copy.aiFreehitButton)).toBeDisabled();
  });

  it('AI Free Hit shows loading state', () => {
    mockIsPremium = true;
    render(<TransferActionBar {...defaultProps} isAiLoading={true} />);
    expect(screen.getByText('…')).toBeDisabled();
  });
});
