import { nameTokens, normalizePlayerName } from './normalize-name';

export interface FplPlayerCandidate {
  code: number;
  webName: string;
  firstName: string;
  secondName: string;
  squadNumber: number | null;
}

export interface TmPlayerCandidate {
  id: string;
  name: string;
  shirtNumber: number | null;
}

export interface PlayerMatchResult {
  fplCode: number;
  tmId: string;
  method: 'exact' | 'shirt' | 'fuzzy' | 'manual';
  confidence: number;
}

function stripInitials(value: string): string {
  return value.replace(/\b[a-z]\./gi, '').replace(/\s+/g, ' ').trim();
}

function cleanTmName(name: string): string {
  return name.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function lastNameToken(fpl: FplPlayerCandidate): string | null {
  const fromSecond = nameTokens(stripInitials(fpl.secondName)).at(-1);
  if (fromSecond) return fromSecond;
  const fromWeb = nameTokens(stripInitials(fpl.webName)).at(-1);
  return fromWeb ?? null;
}

function scorePair(fpl: FplPlayerCandidate, tm: TmPlayerCandidate): number {
  const tmNorm = normalizePlayerName(cleanTmName(tm.name));
  const web = normalizePlayerName(stripInitials(fpl.webName));
  const first = normalizePlayerName(stripInitials(fpl.firstName));
  const last = lastNameToken(fpl);

  if (!tmNorm) return 0;
  const tmTokens = tmNorm.split(' ');
  if (last && !tmTokens.includes(last)) {
    const singleNameOk =
      tmTokens.length === 1 && (tmTokens[0] === web || (first && tmTokens[0] === first));
    if (!singleNameOk) return 0;
  }

  if (web && tmNorm === web) return 1;
  if (last && tmNorm.endsWith(` ${last}`)) {
    if (first && tmNorm.startsWith(`${first} `)) return 0.98;
    if (web && tmNorm.includes(` ${web} `)) return 0.96;
    return 0.92;
  }
  if (web && web.length >= 4 && tmNorm.includes(web)) return 0.85;

  const fplTokens = [
    ...nameTokens(stripInitials(fpl.firstName)),
    ...nameTokens(stripInitials(fpl.secondName)),
    ...nameTokens(stripInitials(fpl.webName)),
  ];
  const tmTok = nameTokens(tmNorm);
  if (fplTokens.length === 0 || tmTok.length === 0) return 0;
  const overlap = fplTokens.filter((t) => tmTok.includes(t)).length;
  return overlap / Math.max(fplTokens.length, tmTok.length);
}

export function matchFplPlayersToTm(
  fplPlayers: FplPlayerCandidate[],
  tmPlayers: TmPlayerCandidate[]
): { matched: PlayerMatchResult[]; unmatchedFpl: FplPlayerCandidate[] } {
  const matched: PlayerMatchResult[] = [];
  const usedTm = new Set<string>();
  const unmatchedFpl: FplPlayerCandidate[] = [];

  const candidates: Array<{
    fpl: FplPlayerCandidate;
    tm: TmPlayerCandidate;
    score: number;
    method: PlayerMatchResult['method'];
  }> = [];

  for (const fpl of fplPlayers) {
    for (const tm of tmPlayers) {
      const score = scorePair(fpl, tm);
      if (score < 0.85) continue;
      let method: PlayerMatchResult['method'] = 'fuzzy';
      if (score >= 0.98) method = 'exact';
      else if (
        fpl.squadNumber != null &&
        tm.shirtNumber != null &&
        fpl.squadNumber === tm.shirtNumber
      ) {
        method = 'shirt';
      }
      candidates.push({ fpl, tm, score, method });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const usedFpl = new Set<number>();
  for (const c of candidates) {
    if (usedFpl.has(c.fpl.code) || usedTm.has(c.tm.id)) continue;
    usedFpl.add(c.fpl.code);
    usedTm.add(c.tm.id);
    matched.push({
      fplCode: c.fpl.code,
      tmId: c.tm.id,
      method: c.method,
      confidence: c.score,
    });
  }

  for (const fpl of fplPlayers) {
    if (!usedFpl.has(fpl.code)) unmatchedFpl.push(fpl);
  }

  return { matched, unmatchedFpl };
}
