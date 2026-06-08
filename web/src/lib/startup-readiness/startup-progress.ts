import type { HealthResponse } from '@/types';

function lineupsWarmupPercent(health: HealthResponse): number | null {
  const { lineupsWarmup: w } = health;
  if (w.phase === 'done' || w.phase === 'error') return 100;

  const hotWeight = 0.7;
  const coldWeight = 0.3;
  const hotPct =
    w.hotTotal > 0 ? Math.min(1, w.hotDone / w.hotTotal) * hotWeight : hotWeight;
  const coldPct =
    w.coldTotal > 0 ? Math.min(1, w.coldDone / w.coldTotal) * coldWeight : 0;
  const phaseBoost = w.phase === 'lineups' ? 0.05 : 0;

  return Math.min(99, (hotPct + coldPct + phaseBoost) * 100);
}

function predictionsWarmupPercent(health: HealthResponse): number | null {
  const { predictionsWarmup: p } = health;
  if (p.phase === 'done' || p.phase === 'error') return 100;
  if (p.phase === 'idle') return 0;
  if (p.phase === 'ingest') return 45;
  if (p.phase === 'score') return 85;
  return 0;
}

export function startupProgressPercent(health: HealthResponse | undefined): number | null {
  if (!health) return null;
  if (health.seed.phase === 'pending' || health.seed.phase === 'running') return null;

  const lineupsPct = lineupsWarmupPercent(health);
  const predictionsPct = predictionsWarmupPercent(health);
  if (lineupsPct === null || predictionsPct === null) return null;
  if (lineupsPct === 100 && predictionsPct === 100) return 100;

  return Math.round(Math.min(99, lineupsPct * 0.6 + predictionsPct * 0.4));
}
