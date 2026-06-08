import { slugFromFd } from '../prediction/team-names';
import type { FplIdentityMapper } from './mapper';

export type TeamSlugLookup = (value: string | number) => string | undefined;

export function softTeamSlugLookup(mapper: FplIdentityMapper): TeamSlugLookup {
  return (value) => {
    try {
      return mapper.resolveTeamSlug(value);
    } catch {
      return undefined;
    }
  };
}

export function resolveFdTeamSlug(
  fdName: string,
  mapper?: FplIdentityMapper,
): string | undefined {
  const slug = slugFromFd(fdName);
  if (!slug) return undefined;
  if (mapper && !mapper.hasSlug(slug)) return undefined;
  return slug;
}
