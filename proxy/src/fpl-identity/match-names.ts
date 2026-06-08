import { nameTokens, normalizePlayerName } from '../tactical-positions/normalize-name';

export function lastNameMatches(gwName: string, rawName: string, webName: string): boolean {
  const gwTokens = nameTokens(gwName);
  const gwLast = gwTokens[gwTokens.length - 1] ?? '';
  if (!gwLast) return false;
  for (const candidate of [rawName, webName]) {
    const tokens = nameTokens(candidate);
    const last = tokens[tokens.length - 1] ?? '';
    if (!last) continue;
    if (last === gwLast) return true;
    const minLen = Math.min(last.length, gwLast.length);
    if (minLen >= 4) {
      const prefixLen = Math.min(6, minLen - 1);
      if (last.slice(0, prefixLen) === gwLast.slice(0, prefixLen)) return true;
    }
  }
  return false;
}

export function playerNamesCompatible(
  mergedGwName: string,
  firstName: string,
  secondName: string,
  webName: string,
): boolean {
  const gwNorm = normalizePlayerName(mergedGwName);
  const rawNorm = normalizePlayerName(`${firstName} ${secondName}`);
  const webNorm = normalizePlayerName(webName);
  const gwTokens = nameTokens(mergedGwName);
  return (
    gwNorm === rawNorm ||
    gwNorm === webNorm ||
    rawNorm.includes(gwNorm) ||
    gwNorm.includes(webNorm) ||
    (gwTokens.length > 0 &&
      gwTokens.every((t) => rawNorm.includes(t) || webNorm.includes(t))) ||
    lastNameMatches(mergedGwName, `${firstName} ${secondName}`, webName)
  );
}

export function webNamesCompatible(nameA: string, nameB: string): boolean {
  const normA = normalizePlayerName(nameA);
  const normB = normalizePlayerName(nameB);
  if (normA === normB) return true;
  if (!normA || !normB) return false;
  if (normA.includes(normB) || normB.includes(normA)) return true;
  return lastNameMatches(nameA, nameB, nameB) || lastNameMatches(nameB, nameA, nameA);
}

export function crossSeasonPlayerMatch(
  entryA: { webName: string; firstName: string; secondName: string },
  entryB: { webName: string; firstName: string; secondName: string },
): boolean {
  const fullA = `${entryA.firstName} ${entryA.secondName}`.trim();
  const fullB = `${entryB.firstName} ${entryB.secondName}`.trim();
  if (webNamesCompatible(entryA.webName, entryB.webName)) return true;
  if (webNamesCompatible(fullA, fullB)) return true;
  return (
    playerNamesCompatible(entryA.webName, entryB.firstName, entryB.secondName, entryB.webName) ||
    playerNamesCompatible(entryB.webName, entryA.firstName, entryA.secondName, entryA.webName) ||
    playerNamesCompatible(fullA, entryB.firstName, entryB.secondName, entryB.webName) ||
    playerNamesCompatible(fullB, entryA.firstName, entryA.secondName, entryA.webName)
  );
}
