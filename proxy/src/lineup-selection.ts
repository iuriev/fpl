import type { FPLBootstrapStatic } from './fpl-client';
import type { LineGroup, RoleQuota } from './lineup-slot-requirements';
import type { TacticalRole } from './player-tactical-role';
import {
  bestQuotaRoleMeritScore,
  fillTierForRole,
  getPlayerTacticalProfile,
  isWingQuotaRole,
  lineAwarePrimaryRole,
  playerCoversWingRole,
  playerQualifiesForAnyQuotaRole,
  playerQualifiesForAnyWingQuotaRole,
  playerQualifiesForWingQuotaRole,
} from './player-tactical-role';

export interface ScoredLineupCandidate {
  el: FPLBootstrapStatic['elements'][number];
  startScore: number;
}

function compareCandidates(a: ScoredLineupCandidate, b: ScoredLineupCandidate): number {
  if (b.startScore !== a.startScore) return b.startScore - a.startScore;
  return parseFloat(b.el.ep_next) - parseFloat(a.el.ep_next);
}

function compareQuotaCandidates(
  a: ScoredLineupCandidate,
  b: ScoredLineupCandidate,
  slotRoles: TacticalRole[],
  line: LineGroup
): number {
  const meritA = bestQuotaRoleMeritScore(a.el.code, slotRoles, line, a.startScore);
  const meritB = bestQuotaRoleMeritScore(b.el.code, slotRoles, line, b.startScore);
  if (meritB !== meritA) return meritB - meritA;
  return compareCandidates(a, b);
}

export function pickLine(candidates: ScoredLineupCandidate[], count: number): ScoredLineupCandidate[] {
  return [...candidates].sort(compareCandidates).slice(0, count);
}

function qualifiesForQuotaPool(
  code: number,
  quota: RoleQuota,
  slotRoles: TacticalRole[],
  line: LineGroup
): boolean {
  if (quota.kind === 'role' && isWingQuotaRole(quota.role, line)) {
    return playerQualifiesForAnyWingQuotaRole(code, slotRoles, line);
  }
  return playerQualifiesForAnyQuotaRole(code, slotRoles, line);
}

function pickBestForQuota(
  candidates: ScoredLineupCandidate[],
  used: Set<number>,
  line: LineGroup,
  quota: RoleQuota
): ScoredLineupCandidate[] {
  const chosen: ScoredLineupCandidate[] = [];
  const min = quota.min;
  const slotRoles: TacticalRole[] =
    quota.kind === 'role' ? [quota.role] : quota.roles;

  for (let i = 0; i < min; i++) {
    const pool = candidates
      .filter(
        (p) => !used.has(p.el.id) && qualifiesForQuotaPool(p.el.code, quota, slotRoles, line)
      )
      .sort((a, b) => compareQuotaCandidates(a, b, slotRoles, line));
    const next = pool[0];
    if (!next) break;
    chosen.push(next);
    used.add(next.el.id);
  }
  return chosen;
}

function pickedFillsWingPrimary(
  picked: ScoredLineupCandidate[],
  wingRole: TacticalRole,
  line: LineGroup
): boolean {
  return picked.some((p) => fillTierForRole(p.el.code, wingRole, line) === 0);
}

function missingOppositeWing(
  picked: ScoredLineupCandidate[],
  line: LineGroup
): TacticalRole | null {
  const pairs: [TacticalRole, TacticalRole][] =
    line === 'DEF'
      ? [
          ['lb', 'rb'],
          ['rb', 'lb'],
        ]
      : line === 'MID'
        ? [
            ['lm', 'rm'],
            ['rm', 'lm'],
          ]
        : [
            ['lw', 'rw'],
            ['rw', 'lw'],
          ];

  for (const [filled, needed] of pairs) {
    if (
      pickedFillsWingPrimary(picked, filled, line) &&
      !pickedCoversWingRole(picked, needed, line)
    ) {
      return needed;
    }
  }
  return null;
}

function pickedCoversWingRole(
  picked: ScoredLineupCandidate[],
  wingRole: TacticalRole,
  line: LineGroup
): boolean {
  return picked.some((p) => playerCoversWingRole(p.el.code, wingRole, line));
}

function oppositeWingRole(role: TacticalRole, line: LineGroup): TacticalRole {
  if (line === 'DEF') return role === 'lb' ? 'rb' : 'lb';
  if (line === 'MID') return role === 'lm' ? 'rm' : 'lm';
  return role === 'lw' ? 'rw' : 'lw';
}

function shouldDeferDuplicateWide(
  candidate: ScoredLineupCandidate,
  picked: ScoredLineupCandidate[],
  pool: ScoredLineupCandidate[],
  line: LineGroup
): boolean {
  const needed = missingOppositeWing(picked, line);
  if (!needed) return false;

  if (playerCoversWingRole(candidate.el.code, needed, line)) return false;

  const filled = oppositeWingRole(needed, line);
  if (!pickedFillsWingPrimary(picked, filled, line)) return false;

  const candPrimary = lineAwarePrimaryRole(
    getPlayerTacticalProfile(candidate.el.code).role,
    line
  );
  if (candPrimary !== filled) return false;

  return pool.some(
    (p) =>
      p.el.id !== candidate.el.id && fillTierForRole(p.el.code, needed, line) === 0
  );
}

function pickNextRestCandidate(
  pool: ScoredLineupCandidate[],
  picked: ScoredLineupCandidate[],
  line: LineGroup,
  quotas: RoleQuota[]
): ScoredLineupCandidate | undefined {
  if (pool.length === 0) return undefined;

  const oppositeNeed = missingOppositeWing(picked, line);
  if (oppositeNeed) {
    const primaryCover = pool
      .filter((p) => fillTierForRole(p.el.code, oppositeNeed, line) === 0)
      .sort((a, b) => compareQuotaCandidates(a, b, [oppositeNeed], line));
    if (primaryCover[0]) return primaryCover[0];

    const secondaryCover = pool
      .filter((p) => fillTierForRole(p.el.code, oppositeNeed, line) === 1)
      .sort((a, b) => compareQuotaCandidates(a, b, [oppositeNeed], line));
    if (secondaryCover[0]) return secondaryCover[0];
  }

  for (const quota of quotas) {
    if (quota.kind !== 'role' || !isWingQuotaRole(quota.role, line)) continue;
    if (pickedCoversWingRole(picked, quota.role, line)) continue;

    const cover = pool
      .filter((p) => playerQualifiesForWingQuotaRole(p.el.code, quota.role, line))
      .sort((a, b) => compareQuotaCandidates(a, b, [quota.role], line));
    if (cover[0]) return cover[0];
  }

  const sorted = [...pool].sort(compareCandidates);
  for (const p of sorted) {
    if (!shouldDeferDuplicateWide(p, picked, pool, line)) return p;
  }
  return sorted[0];
}

export function pickLineWithRoleQuotas(
  candidates: ScoredLineupCandidate[],
  count: number,
  quotas: RoleQuota[],
  line: LineGroup
): ScoredLineupCandidate[] {
  const used = new Set<number>();
  const picked: ScoredLineupCandidate[] = [];

  for (const quota of quotas) {
    for (const p of pickBestForQuota(candidates, used, line, quota)) {
      picked.push(p);
    }
  }

  while (picked.length < count) {
    const pool = candidates.filter((p) => !used.has(p.el.id));
    const next = pickNextRestCandidate(pool, picked, line, quotas);
    if (!next) break;
    picked.push(next);
    used.add(next.el.id);
  }

  return [...picked].sort(compareCandidates);
}
