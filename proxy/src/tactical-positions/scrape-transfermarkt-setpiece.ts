export type SetpieceRole = 'corner' | 'corner_r' | 'corner_l' | 'freekick_direct' | 'freekick_cross';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// Patterns mapped to set-piece roles (case-insensitive HTML text matching)
const SETPIECE_PATTERNS: Array<{ pattern: RegExp; role: SetpieceRole }> = [
  { pattern: /corner kicks?\s*\(right\)/i, role: 'corner_r' },
  { pattern: /corner kicks?\s*\(left\)/i, role: 'corner_l' },
  { pattern: /corner kicks?(?!\s*\()/i, role: 'corner' },
  { pattern: /direct\s+free\s*kicks?/i, role: 'freekick_direct' },
  { pattern: /indirect\s+free\s*kicks?/i, role: 'freekick_cross' },
  { pattern: /free\s*kicks?\s*\(cross\)/i, role: 'freekick_cross' },
  { pattern: /free\s*kicks?\s*\(direct\)/i, role: 'freekick_direct' },
];

export function parseSetpieceRoles(html: string): SetpieceRole[] {
  // TM profile pages contain set-piece info in a data table section.
  // We look for the section that describes "further information" or "set pieces" and
  // extract role-tagged text. Matching multiple patterns handles layout variations.
  const found = new Set<SetpieceRole>();

  // Strip script/style blocks to reduce false matches
  const stripped = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');

  for (const { pattern, role } of SETPIECE_PATTERNS) {
    if (pattern.test(stripped)) {
      found.add(role);
    }
  }

  // Deduplicate: if we found corner_r or corner_l, remove the generic 'corner'
  if (found.has('corner_r') || found.has('corner_l')) {
    found.delete('corner');
  }

  return [...found];
}

export function buildProfileUrl(tmId: string): string {
  return `https://www.transfermarkt.com/player/profil/spieler/${tmId}`;
}

export async function fetchSetpieceRoles(tmId: string): Promise<SetpieceRole[]> {
  const url = buildProfileUrl(tmId);
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-GB,en;q=0.9',
    },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`Transfermarkt profile ${url} → HTTP ${res.status}`);
  }
  const html = await res.text();
  return parseSetpieceRoles(html);
}
