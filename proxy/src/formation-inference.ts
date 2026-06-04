import type { FPLBootstrapStatic, FPLElementSummary,FPLFixture } from './fpl-client';

export type FormationSource = 'recent_fixtures' | 'previous_season' | 'default';

export interface FormationCounts {
  def: number;
  mid: number;
  fwd: number;
}

export interface InferredFormation {
  counts: FormationCounts;
  label: string;
  source: FormationSource;
}

export function formationLabel(counts: FormationCounts): string {
  return `${counts.def}-${counts.mid}-${counts.fwd}`;
}

export function isValidFormation(counts: FormationCounts): boolean {
  const { def, mid, fwd } = counts;
  return (
    def >= 3 &&
    def <= 5 &&
    mid >= 2 &&
    mid <= 5 &&
    fwd >= 1 &&
    fwd <= 3 &&
    def + mid + fwd === 10
  );
}

export function countsFromStarters(
  starterTypes: number[]
): FormationCounts | null {
  let def = 0;
  let mid = 0;
  let fwd = 0;
  for (const t of starterTypes) {
    if (t === 2) def++;
    else if (t === 3) mid++;
    else if (t === 4) fwd++;
    else if (t === 1) continue;
    else return null;
  }
  const counts = { def, mid, fwd };
  return isValidFormation(counts) ? counts : null;
}

export function formationFromFixture(
  fixtureId: number,
  teamId: number,
  elements: FPLBootstrapStatic['elements'],
  getSummary: (elementId: number) => FPLElementSummary | undefined
): FormationCounts | null {
  const types: number[] = [];
  for (const el of elements) {
    if (el.team !== teamId) continue;
    const summary = getSummary(el.id);
    const row = summary?.history.find((h) => h.fixture === fixtureId);
    if (!row) continue;
    const started = row.starts > 0 || (row.starts === 0 && row.minutes >= 60);
    if (started) types.push(el.element_type);
  }
  if (types.filter((t) => t === 1).length !== 1) return null;
  return countsFromStarters(types);
}

function modeFormation(formations: FormationCounts[]): FormationCounts | null {
  if (formations.length === 0) return null;
  const key = (c: FormationCounts) => `${c.def}-${c.mid}-${c.fwd}`;
  const counts = new Map<string, { n: number; c: FormationCounts; latest: number }>();
  formations.forEach((f, i) => {
    const k = key(f);
    const prev = counts.get(k);
    if (!prev) counts.set(k, { n: 1, c: f, latest: i });
    else counts.set(k, { n: prev.n + 1, c: f, latest: Math.min(prev.latest, i) });
  });
  let best: { n: number; c: FormationCounts; latest: number } | null = null;
  for (const v of counts.values()) {
    if (
      !best ||
      v.n > best.n ||
      (v.n === best.n && v.latest < best.latest)
    ) {
      best = v;
    }
  }
  return best?.c ?? null;
}

export function teamFinishedFixtures(
  teamId: number,
  fixtures: FPLFixture[]
): FPLFixture[] {
  return fixtures
    .filter((f) => f.finished && (f.team_h === teamId || f.team_a === teamId))
    .sort((a, b) => {
      const ta = a.kickoff_time ?? '';
      const tb = b.kickoff_time ?? '';
      return tb.localeCompare(ta);
    });
}

export function inferFormationForTeam(
  teamId: number,
  bootstrap: FPLBootstrapStatic,
  allFixtures: FPLFixture[],
  getSummary: (elementId: number) => FPLElementSummary | undefined,
  previousSeasonFormation: FormationCounts | null
): InferredFormation {
  const teamFixtures = teamFinishedFixtures(teamId, allFixtures);
  const recentFormations: FormationCounts[] = [];

  for (const fixture of teamFixtures.slice(0, 5)) {
    const counts = formationFromFixture(fixture.id, teamId, bootstrap.elements, getSummary);
    if (counts) recentFormations.push(counts);
  }

  const mode = modeFormation(recentFormations);
  if (mode) {
    return { counts: mode, label: formationLabel(mode), source: 'recent_fixtures' };
  }

  if (previousSeasonFormation && isValidFormation(previousSeasonFormation)) {
    return {
      counts: previousSeasonFormation,
      label: formationLabel(previousSeasonFormation),
      source: 'previous_season',
    };
  }

  const defaultCounts: FormationCounts = { def: 4, mid: 3, fwd: 3 };
  return {
    counts: defaultCounts,
    label: formationLabel(defaultCounts),
    source: 'default',
  };
}
