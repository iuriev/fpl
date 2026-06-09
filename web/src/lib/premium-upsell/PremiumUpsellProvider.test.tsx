import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { copy } from '@/lib/copy';
import { usePremiumStatus } from '@/lib/use-premium-status';

import { useRequestPremiumUpsell } from './PremiumUpsellContext';
import { PremiumUpsellProvider } from './PremiumUpsellProvider';
import { readPremiumUpsellConfig } from './readPremiumUpsellConfig';

vi.mock('@/lib/use-premium-status', () => ({
  usePremiumStatus: vi.fn(() => false),
}));

vi.mock('./readPremiumUpsellConfig', () => ({
  readPremiumUpsellConfig: vi.fn(() => ({
    enabled: true,
    cooldownMs: 86_400_000,
  })),
}));

function Trigger({ screen }: { screen: 'transfer' | 'predictions' }) {
  const request = useRequestPremiumUpsell();
  return (
    <button type="button" onClick={() => request(screen)}>
      trigger
    </button>
  );
}

describe('PremiumUpsellProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(usePremiumStatus).mockReturnValue(false);
    vi.mocked(readPremiumUpsellConfig).mockReturnValue({
      enabled: true,
      cooldownMs: 86_400_000,
    });
  });

  it('opens dialog when eligible', async () => {
    const user = userEvent.setup();
    render(
      <PremiumUpsellProvider>
        <Trigger screen="transfer" />
      </PremiumUpsellProvider>
    );
    await user.click(screen.getByRole('button', { name: 'trigger' }));
    expect(screen.getByText(copy.premiumUpsellTransferTitle)).toBeInTheDocument();
  });

  it('does not open for premium users', async () => {
    vi.mocked(usePremiumStatus).mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <PremiumUpsellProvider>
        <Trigger screen="transfer" />
      </PremiumUpsellProvider>
    );
    await user.click(screen.getByRole('button', { name: 'trigger' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not open when disabled via config', async () => {
    vi.mocked(readPremiumUpsellConfig).mockReturnValue({
      enabled: false,
      cooldownMs: 86_400_000,
    });
    const user = userEvent.setup();
    render(
      <PremiumUpsellProvider>
        <Trigger screen="transfer" />
      </PremiumUpsellProvider>
    );
    await user.click(screen.getByRole('button', { name: 'trigger' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('records cooldown on close', async () => {
    const user = userEvent.setup();
    render(
      <PremiumUpsellProvider>
        <Trigger screen="transfer" />
      </PremiumUpsellProvider>
    );
    await user.click(screen.getByRole('button', { name: 'trigger' }));
    await user.click(screen.getByRole('button', { name: copy.premiumUpsellCta }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const stored = localStorage.getItem('fpl_premium_upsell_last_transfer');
    expect(stored).not.toBeNull();
    expect(Date.now() - Number(stored)).toBeLessThan(5000);
  });
});
