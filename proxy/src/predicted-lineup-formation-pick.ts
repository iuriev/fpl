import {
  type FormationCounts,
  formationLabel,
  type InferredFormation,
} from './formation-inference';
import {
  adjustFormationForSquad,
  allValidFormations,
  formationDistance,
  formationFitsSquad,
  type SquadLineAvailability,
} from './formation-squad-fit';
import { isExcludedFromPredictedLineup } from './lineup-availability';
import { pickLine, pickLineWithRoleQuotas, type ScoredLineupCandidate } from './lineup-selection';
import type { LineGroup } from './lineup-slot-requirements';
import { getRoleQuotasForLine } from './lineup-slot-requirements';

const ELEMENT_LINE: Record<number, LineGroup> = {
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

function pickOutfieldLine(
  scored: ScoredLineupCandidate[],
  elementType: number,
  count: number,
  kickoffTime: string | null
): ScoredLineupCandidate[] {
  const eligible = scored.filter(
    (p) =>
      p.el.element_type === elementType &&
      !isExcludedFromPredictedLineup(p.el, kickoffTime)
  );
  const line = ELEMENT_LINE[elementType];
  const quotas = line ? getRoleQuotasForLine(line, count) : null;
  if (quotas && line) {
    return pickLineWithRoleQuotas(eligible, count, quotas, line);
  }
  return pickLine(eligible, count);
}

export function scoreLineupForFormation(
  scored: ScoredLineupCandidate[],
  counts: FormationCounts,
  kickoffTime: string | null
): number {
  const gk = pickLine(
    scored.filter(
      (p) => p.el.element_type === 1 && !isExcludedFromPredictedLineup(p.el, kickoffTime)
    ),
    1
  );
  const def = pickOutfieldLine(scored, 2, counts.def, kickoffTime);
  const mid = pickOutfieldLine(scored, 3, counts.mid, kickoffTime);
  const fwd = pickOutfieldLine(scored, 4, counts.fwd, kickoffTime);
  const picks = [...gk, ...def, ...mid, ...fwd];
  return picks.reduce((s, p) => s + p.startScore, 0);
}

export function pickFormationByLineupScore(
  inferred: InferredFormation,
  avail: SquadLineAvailability,
  scored: ScoredLineupCandidate[],
  kickoffTime: string | null
): InferredFormation {
  const candidates = allValidFormations().filter((counts) =>
    formationFitsSquad(counts, avail)
  );

  if (candidates.length === 0) {
    return adjustFormationForSquad(inferred, avail);
  }

  const scoredCandidates = candidates.map((counts) => ({
    counts,
    score: scoreLineupForFormation(scored, counts, kickoffTime),
    distance: formationDistance(inferred.counts, counts),
  }));
  const SWITCH_MARGIN = 0.4;

  if (formationFitsSquad(inferred.counts, avail)) {
    const inferredScore = scoreLineupForFormation(
      scored,
      inferred.counts,
      kickoffTime
    );
    const maxScore = Math.max(...scoredCandidates.map((c) => c.score));
    if (maxScore - inferredScore < SWITCH_MARGIN) {
      return inferred;
    }
  }

  scoredCandidates.sort((a, b) => b.score - a.score);
  const topByScore = scoredCandidates.slice(0, 3);
  topByScore.sort((a, b) => a.distance - b.distance);
  const chosen = topByScore[0]!.counts;
  return {
    counts: chosen,
    label: formationLabel(chosen),
    source: 'lineup_fit',
  };
}

export { pickOutfieldLine };
