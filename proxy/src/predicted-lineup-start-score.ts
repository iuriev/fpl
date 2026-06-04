import type { FPLBootstrapStatic, FPLElementSummary } from './fpl-client';

const RECENT_GW_WINDOW = 8;
const STARTS_SAMPLE = 5;

export function computePredictedStartScore(
  el: FPLBootstrapStatic['elements'][number],
  summary: FPLElementSummary | undefined
): number {
  const rows = summary?.history ?? [];
  const recent = rows.slice(-RECENT_GW_WINDOW);
  let startsScore =
    recent.length === 0
      ? 0
      : recent.filter((r) => r.starts > 0).length / Math.min(STARTS_SAMPLE, recent.length);
  let minutesScore =
    recent.length === 0
      ? 0
      : recent.reduce((s, r) => s + r.minutes, 0) / recent.length / 90;

  if (recent.length === 0 && el.minutes > 0) {
    const impliedAppearances = Math.max(1, Math.min(RECENT_GW_WINDOW, Math.round(el.minutes / 45)));
    startsScore = Math.min(1, impliedAppearances / STARTS_SAMPLE);
    minutesScore = Math.min(1, el.minutes / impliedAppearances / 90);
  }

  const chance = el.chance_of_playing_next_round ?? el.chance_of_playing_this_round ?? 100;
  const chanceScore = chance / 100;
  let statusMult = 1;
  if (el.status === 'i' || el.status === 's' || el.status === 'u') statusMult = 0;
  else if (el.status === 'd') statusMult = 0.5;

  return (0.4 * startsScore + 0.3 * minutesScore + 0.3 * chanceScore) * statusMult;
}
