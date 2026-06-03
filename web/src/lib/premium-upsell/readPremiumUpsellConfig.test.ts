import { describe, expect, it } from 'vitest';

import { readPremiumUpsellConfig } from './readPremiumUpsellConfig';

describe('readPremiumUpsellConfig', () => {
  it('defaults to enabled with 24h cooldown', () => {
    expect(readPremiumUpsellConfig({} as ImportMetaEnv)).toEqual({
      enabled: true,
      cooldownMs: 86_400_000,
    });
  });

  it('disables when VITE_PREMIUM_UPSELL_ENABLED is false', () => {
    expect(
      readPremiumUpsellConfig({
        VITE_PREMIUM_UPSELL_ENABLED: 'false',
      } as ImportMetaEnv)
    ).toMatchObject({ enabled: false });
  });

  it('uses custom cooldown from env', () => {
    expect(
      readPremiumUpsellConfig({
        VITE_PREMIUM_UPSELL_COOLDOWN_MS: '3600000',
      } as ImportMetaEnv)
    ).toMatchObject({ cooldownMs: 3_600_000 });
  });

  it('falls back to 24h for invalid cooldown', () => {
    expect(
      readPremiumUpsellConfig({
        VITE_PREMIUM_UPSELL_COOLDOWN_MS: 'nope',
      } as ImportMetaEnv)
    ).toMatchObject({ cooldownMs: 86_400_000 });
  });

  it('falls back to 24h for negative cooldown', () => {
    expect(
      readPremiumUpsellConfig({
        VITE_PREMIUM_UPSELL_COOLDOWN_MS: '-1',
      } as ImportMetaEnv)
    ).toMatchObject({ cooldownMs: 86_400_000 });
  });
});
