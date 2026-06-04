const ACCENT_MAP: Record<string, string> = {
  à: 'a',
  á: 'a',
  â: 'a',
  ä: 'a',
  ã: 'a',
  å: 'a',
  è: 'e',
  é: 'e',
  ê: 'e',
  ë: 'e',
  ì: 'i',
  í: 'i',
  î: 'i',
  ï: 'i',
  ò: 'o',
  ó: 'o',
  ô: 'o',
  ö: 'o',
  ø: 'o',
  ù: 'u',
  ú: 'u',
  û: 'u',
  ü: 'u',
  ý: 'y',
  ñ: 'n',
  ç: 'c',
  æ: 'ae',
  œ: 'oe',
  ß: 'ss',
};

export function normalizePlayerName(value: string): string {
  let s = value.trim().toLowerCase();
  for (const [from, to] of Object.entries(ACCENT_MAP)) {
    s = s.split(from).join(to);
  }
  s = s.normalize('NFD').replace(/\p{M}/gu, '');
  s = s.replace(/\b(jr|sr|ii|iii)\b\.?/gi, '');
  s = s.replace(/[^a-z0-9\s-]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

export function nameTokens(value: string): string[] {
  const n = normalizePlayerName(value);
  return n ? n.split(' ') : [];
}
