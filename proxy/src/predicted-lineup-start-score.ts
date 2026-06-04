import type { FPLBootstrapStatic, FPLElementSummary } from './fpl-client';

const RECENT_SHORT_WINDOW = 3;
const RECENT_LONG_WINDOW = 8;
const LONG_STARTS_SAMPLE = 5;

function rowStarted(minutes: number, starts: number): boolean {
  return starts > 0;
}

function startsRate(rows: FPLElementSummary['history']): number {
  if (rows.length === 0) return 0;
  const started = rows.filter((r) => rowStarted(r.minutes, r.starts)).length;
  return started / rows.length;
}

function minutesRate(rows: FPLElementSummary['history']): number {
  if (rows.length === 0) return 0;
  return rows.reduce((s, r) => s + r.minutes, 0) / rows.length / 90;
}

export function computePredictedStartScore(
  el: FPLBootstrapStatic['elements'][number],
  summary: FPLElementSummary | undefined
): number {
  const rows = summary?.history ?? [];
  const shortRecent = rows.slice(-RECENT_SHORT_WINDOW);
  const longRecent = rows.slice(-RECENT_LONG_WINDOW);

  let startsScore =
    shortRecent.length === 0
      ? 0
      : 0.65 * startsRate(shortRecent) +
        0.35 * startsRate(longRecent.slice(-Math.min(LONG_STARTS_SAMPLE, longRecent.length)));

  let minutesScore =
    shortRecent.length === 0 ? 0 : minutesRate(shortRecent);

  if (rows.length === 0 && el.minutes > 0) {
    const impliedAppearances = Math.max(
      1,
      Math.min(RECENT_LONG_WINDOW, Math.round(el.minutes / 45))
    );
    startsScore = Math.min(1, impliedAppearances / LONG_STARTS_SAMPLE);
    minutesScore = Math.min(1, el.minutes / impliedAppearances / 90);
  }

  const lastRow = rows.at(-1);
  const lastMatchBoost = lastRow && rowStarted(lastRow.minutes, lastRow.starts) ? 0.12 : 0;

  const lastTwo = rows.slice(-2);
  const benchStreakMult =
    lastTwo.length === 2 &&
    lastTwo.every((r) => !rowStarted(r.minutes, r.starts))
      ? 0.5
      : 1;

  const chance = el.chance_of_playing_next_round ?? el.chance_of_playing_this_round ?? 100;
  const chanceScore = chance / 100;
  let statusMult = 1;
  if (el.status === 'i' || el.status === 's' || el.status === 'u') statusMult = 0;
  else if (el.status === 'd') statusMult = 0.5;

  const isGk = el.element_type === 1;
  const gkLastOnly =
    isGk && shortRecent.length > 0
      ? rowStarted(shortRecent.at(-1)!.minutes, shortRecent.at(-1)!.starts)
        ? 0.92
        : startsRate(shortRecent) * 0.7
      : null;

  const base =
    gkLastOnly != null
      ? gkLastOnly
      : 0.45 * startsScore + 0.25 * minutesScore + 0.2 * chanceScore + lastMatchBoost;

  return Math.min(1, base * statusMult * benchStreakMult);
}

export function startedLastMatch(summary: FPLElementSummary | undefined): boolean {
  const last = summary?.history.at(-1);
  return last != null && rowStarted(last.minutes, last.starts);
}

export function effectivePredictedStartScore(
  el: FPLBootstrapStatic['elements'][number],
  summary: FPLElementSummary | undefined
): number {
  const raw = computePredictedStartScore(el, summary);
  if (el.element_type === 4 && !startedLastMatch(summary)) {
    return raw * 0.5;
  }
  if (el.element_type === 3 && !startedLastMatch(summary)) {
    return raw * 0.82;
  }
  return raw;
}
