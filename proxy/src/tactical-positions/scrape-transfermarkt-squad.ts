export interface TmSquadPlayer {
  id: string;
  name: string;
  position: string;
  shirtNumber: number | null;
}

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const PLAYER_BLOCK_RE =
  /<a href="[^"]*\/profil\/spieler\/(\d+)"[^>]*>\s*([\s\S]*?)<\/a>[\s\S]*?<td>\s*([^<]+?)\s*<\/td>/gi;

export function buildSquadUrl(slug: string, clubId: string, seasonId = '2024'): string {
  return `https://www.transfermarkt.com/${slug}/kader/verein/${clubId}/saison_id/${seasonId}/plus/1`;
}

export function parseTransfermarktSquadHtml(html: string): TmSquadPlayer[] {
  const players: TmSquadPlayer[] = [];
  const seen = new Set<string>();

  const rowChunks = html.split(/<tr class="(?:odd|even)(?:\s+[^"]*)?">/i).slice(1);
  for (const chunk of rowChunks) {
    PLAYER_BLOCK_RE.lastIndex = 0;
    const m = PLAYER_BLOCK_RE.exec(chunk);
    if (!m) continue;

    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);

    const name = m[2]
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const position = m[3].replace(/\s+/g, ' ').trim();
    if (!name || !position) continue;

    const shirtMatch = chunk.match(/rn_nummer>(\d+)</);
    const shirtNumber = shirtMatch ? Number(shirtMatch[1]) : null;

    players.push({
      id,
      name,
      position,
      shirtNumber: Number.isFinite(shirtNumber) ? shirtNumber : null,
    });
  }

  return players;
}

export async function fetchTransfermarktSquad(
  slug: string,
  clubId: string,
  seasonId = '2024'
): Promise<TmSquadPlayer[]> {
  const url = buildSquadUrl(slug, clubId, seasonId);
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-GB,en;q=0.9',
    },
  });
  if (!res.ok) {
    throw new Error(`Transfermarkt ${url} → HTTP ${res.status}`);
  }
  const html = await res.text();
  return parseTransfermarktSquadHtml(html);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
