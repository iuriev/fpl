import type { PremiumUpsellScreen } from './PremiumUpsellContext';

const KEYS: Record<PremiumUpsellScreen, string> = {
  transfer: 'fpl_premium_upsell_last_transfer',
  predictions: 'fpl_premium_upsell_last_predictions',
  market: 'fpl_premium_upsell_last_market',
};

export function getLastShown(screen: PremiumUpsellScreen): number | null {
  const raw = localStorage.getItem(KEYS[screen]);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function setLastShown(screen: PremiumUpsellScreen, at: number): void {
  localStorage.setItem(KEYS[screen], String(at));
}

export function isCooldownElapsed(
  screen: PremiumUpsellScreen,
  cooldownMs: number,
  now = Date.now()
): boolean {
  const last = getLastShown(screen);
  if (last === null) return true;
  return now - last >= cooldownMs;
}
