import {
  type FormationCounts,
  formationLabel,
  type InferredFormation,
  isValidFormation,
} from './formation-inference';
import type { FPLBootstrapStatic } from './fpl-client';
import { isExcludedFromPredictedLineup } from './lineup-availability';

export interface SquadLineAvailability {
  gk: number;
  def: number;
  mid: number;
  fwd: number;
}

export function countEligibleByLine(
  squad: FPLBootstrapStatic['elements'],
  kickoffTime: string | null
): SquadLineAvailability {
  const counts: SquadLineAvailability = { gk: 0, def: 0, mid: 0, fwd: 0 };
  for (const el of squad) {
    if (isExcludedFromPredictedLineup(el, kickoffTime)) continue;
    if (el.element_type === 1) counts.gk++;
    else if (el.element_type === 2) counts.def++;
    else if (el.element_type === 3) counts.mid++;
    else if (el.element_type === 4) counts.fwd++;
  }
  return counts;
}

export function allValidFormations(): FormationCounts[] {
  const out: FormationCounts[] = [];
  for (let def = 3; def <= 5; def++) {
    for (let mid = 2; mid <= 5; mid++) {
      const fwd = 10 - def - mid;
      const counts = { def, mid, fwd };
      if (isValidFormation(counts)) out.push(counts);
    }
  }
  return out;
}

export function formationDistance(a: FormationCounts, b: FormationCounts): number {
  return Math.abs(a.def - b.def) + Math.abs(a.mid - b.mid) + Math.abs(a.fwd - b.fwd);
}

export function formationFitsSquad(
  counts: FormationCounts,
  avail: SquadLineAvailability
): boolean {
  return (
    avail.gk >= 1 &&
    avail.def >= counts.def &&
    avail.mid >= counts.mid &&
    avail.fwd >= counts.fwd
  );
}

function spareCapacity(avail: SquadLineAvailability, counts: FormationCounts): FormationCounts {
  return {
    def: avail.def - counts.def,
    mid: avail.mid - counts.mid,
    fwd: avail.fwd - counts.fwd,
  };
}

function fitFormationToAvailability(
  preferred: FormationCounts,
  avail: SquadLineAvailability
): FormationCounts {
  let def = Math.min(preferred.def, avail.def);
  let mid = Math.min(preferred.mid, avail.mid);
  let fwd = Math.min(preferred.fwd, avail.fwd);

  const bump = (line: 'def' | 'mid' | 'fwd') => {
    if (line === 'def' && def < avail.def) def++;
    else if (line === 'mid' && mid < avail.mid) mid++;
    else if (line === 'fwd' && fwd < avail.fwd) fwd++;
  };

  while (def + mid + fwd < 10) {
    const spare = spareCapacity(avail, { def, mid, fwd });
    const order = (['def', 'mid', 'fwd'] as const).sort((a, b) => spare[b] - spare[a]);
    const before = def + mid + fwd;
    for (const line of order) bump(line);
    if (def + mid + fwd === before) break;
  }

  while (def + mid + fwd > 10) {
    const excess = {
      def: def - preferred.def,
      mid: mid - preferred.mid,
      fwd: fwd - preferred.fwd,
    };
    const order = (['def', 'mid', 'fwd'] as const).sort((a, b) => excess[b] - excess[a]);
    const before = def + mid + fwd;
    for (const line of order) {
      if (line === 'def' && def > 3) def--;
      else if (line === 'mid' && mid > 2) mid--;
      else if (line === 'fwd' && fwd > 1) fwd--;
    }
    if (def + mid + fwd === before) break;
  }

  const counts = { def, mid, fwd };
  if (isValidFormation(counts) && formationFitsSquad(counts, avail)) return counts;
  return { def: 4, mid: 5, fwd: 1 };
}

export function adjustFormationForSquad(
  formation: InferredFormation,
  avail: SquadLineAvailability
): InferredFormation {
  if (formationFitsSquad(formation.counts, avail)) return formation;

  const ranked = allValidFormations()
    .map((counts) => ({ counts, distance: formationDistance(formation.counts, counts) }))
    .sort((a, b) => a.distance - b.distance);

  const match = ranked.find((r) => formationFitsSquad(r.counts, avail));
  const counts = match?.counts ?? fitFormationToAvailability(formation.counts, avail);

  return {
    counts,
    label: formationLabel(counts),
    source: 'squad_fit',
  };
}
