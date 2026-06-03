const DEFAULT_COOLDOWN_MS = 86_400_000;

export type PremiumUpsellConfig = {
  enabled: boolean;
  cooldownMs: number;
};

function parseCooldownMs(raw: string | undefined): number {
  if (raw === undefined || raw === '') return DEFAULT_COOLDOWN_MS;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_COOLDOWN_MS;
  return n;
}

export function readPremiumUpsellConfig(
  env: ImportMetaEnv = import.meta.env
): PremiumUpsellConfig {
  return {
    enabled: env.VITE_PREMIUM_UPSELL_ENABLED !== 'false',
    cooldownMs: parseCooldownMs(env.VITE_PREMIUM_UPSELL_COOLDOWN_MS),
  };
}
