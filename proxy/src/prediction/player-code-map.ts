import { loadIdentityMapper } from '../fpl-identity/load-mapper';
import { defaultDataDir } from './ingest';

export async function loadElementToFplCode(
  season: string,
  dataDir = defaultDataDir(),
): Promise<Map<number, number>> {
  const mapper = await loadIdentityMapper(season, dataDir);
  return new Map(mapper.elementToCodeMap());
}
