import type { HealthResponse } from '@/types';

export function startupProgressPercent(health: HealthResponse | undefined): number | null {
  if (!health) return null;
  if (health.seed.phase === 'pending' || health.seed.phase === 'running') return null;

  const { lineupsWarmup: w } = health;
  if (w.phase === 'done' || w.phase === 'error') return 100;

  const hotWeight = 0.7;
  const coldWeight = 0.3;
  const hotPct =
    w.hotTotal > 0 ? Math.min(1, w.hotDone / w.hotTotal) * hotWeight : hotWeight;
  const coldPct =
    w.coldTotal > 0 ? Math.min(1, w.coldDone / w.coldTotal) * coldWeight : 0;
  const phaseBoost = w.phase === 'lineups' ? 0.05 : 0;

  return Math.round(Math.min(99, (hotPct + coldPct + phaseBoost) * 100));
}
