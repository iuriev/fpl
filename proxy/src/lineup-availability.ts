import type { FPLBootstrapStatic } from './fpl-client';

type LineupElement = Pick<
  FPLBootstrapStatic['elements'][number],
  'status' | 'chance_of_playing_next_round' | 'chance_of_playing_this_round' | 'news'
>;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const RETURN_DATE_RE =
  /(?:expected back|back\s+(?:on\s+)?|until|available)\s+(\d{1,2})\s+([A-Za-z]{3})(?:\s+(\d{4}))?/i;

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

export function parseExpectedReturnDate(
  news: string,
  referenceDate = new Date()
): Date | null {
  const trimmed = news.trim();
  if (!trimmed) return null;
  const match = RETURN_DATE_RE.exec(trimmed);
  if (!match) return null;
  const day = Number(match[1]);
  const monthKey = match[2].toLowerCase().slice(0, 3);
  const month = MONTHS[monthKey];
  if (month === undefined || !Number.isFinite(day)) return null;
  let year = match[3] ? Number(match[3]) : referenceDate.getFullYear();
  let candidate = new Date(Date.UTC(year, month, day, 12, 0, 0));
  if (!match[3] && candidate.getTime() < referenceDate.getTime() - 180 * MS_PER_DAY) {
    year += 1;
    candidate = new Date(Date.UTC(year, month, day, 12, 0, 0));
  }
  return candidate;
}

export function fixtureAvailabilityCutoff(kickoffTime: string | null): Date | null {
  if (!kickoffTime) return null;
  const kickoff = new Date(kickoffTime);
  if (Number.isNaN(kickoff.getTime())) return null;
  return new Date(kickoff.getTime() - MS_PER_DAY);
}

export function isExcludedFromPredictedLineup(
  el: LineupElement,
  kickoffTime: string | null,
  now = new Date()
): boolean {
  if (el.status === 's' || el.status === 'u' || el.status === 'n') return true;

  const chance =
    el.chance_of_playing_next_round ?? el.chance_of_playing_this_round ?? null;
  if (chance === 0) return true;

  if (el.status === 'i') {
    const cutoff = fixtureAvailabilityCutoff(kickoffTime) ?? now;
    const returnDate = parseExpectedReturnDate(el.news, now);
    if (returnDate && returnDate.getTime() > cutoff.getTime()) return true;
    if (!returnDate && chance !== null && chance < 50) return true;
    if (!returnDate && chance === null) return true;
  }

  return false;
}

export function hasInjuryWarning(
  el: LineupElement,
  kickoffTime: string | null,
  now = new Date()
): boolean {
  if (isExcludedFromPredictedLineup(el, kickoffTime, now)) return false;

  const chance =
    el.chance_of_playing_next_round ?? el.chance_of_playing_this_round ?? null;

  if (el.status === 'd') return true;
  if (el.status === 'i') return true;
  if (chance != null && chance < 75) return true;

  const cutoff = fixtureAvailabilityCutoff(kickoffTime);
  const returnDate = parseExpectedReturnDate(el.news, now);
  if (
    returnDate &&
    cutoff &&
    returnDate.getTime() > cutoff.getTime() &&
    returnDate.getTime() <= new Date(kickoffTime!).getTime()
  ) {
    return true;
  }

  return false;
}
