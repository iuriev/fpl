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

  // Gates are off by default (VITE_AI_FREEHIT_GATES_ENABLED=false in test env)
  it('AI Free Hit is always active when gates disabled (default)', async () => {
    mockIsPremium = false;
    const user = userEvent.setup();
    render(<TransferActionBar {...defaultProps} freehitAvailable={false} />);
    await user.click(screen.getByText(copy.aiFreehitButton));
    expect(defaultProps.onAiFreeHit).toHaveBeenCalled();
    expect(mockRequestPremiumUpsell).not.toHaveBeenCalled();
  });

  it('AI Free Hit shows loading state', () => {
    render(<TransferActionBar {...defaultProps} isAiLoading={true} />);
    expect(screen.getByText('…')).toBeDisabled();
  });
});
