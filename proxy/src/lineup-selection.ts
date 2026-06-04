import type { FPLBootstrapStatic } from './fpl-client';
import type { LineGroup, RoleQuota } from './lineup-slot-requirements';
import type { TacticalRole } from './player-tactical-role';
import { playerFillsAnyRole, playerFillsRole } from './player-tactical-role';

export interface ScoredLineupCandidate {
  el: FPLBootstrapStatic['elements'][number];
  startScore: number;
}

function compareCandidates(a: ScoredLineupCandidate, b: ScoredLineupCandidate): number {
  if (b.startScore !== a.startScore) return b.startScore - a.startScore;
  return parseFloat(b.el.ep_next) - parseFloat(a.el.ep_next);
}

export function pickLine(candidates: ScoredLineupCandidate[], count: number): ScoredLineupCandidate[] {
  return [...candidates].sort(compareCandidates).slice(0, count);
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
        (p) => !used.has(p.el.id) && playerFillsAnyRole(p.el.code, slotRoles, line)
      )
      .sort(compareCandidates);
    const next = pool[0];
    if (!next) break;
    chosen.push(next);
    used.add(next.el.id);
  }
  return chosen;
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

  const rest = candidates
    .filter((p) => !used.has(p.el.id))
    .sort(compareCandidates);
  for (const p of rest) {
    if (picked.length >= count) break;
    picked.push(p);
    used.add(p.el.id);
  }

  return [...picked].sort(compareCandidates);
}
