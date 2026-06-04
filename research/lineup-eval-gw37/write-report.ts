import type { StarterMetrics } from './run-eval-types.ts';

export interface CombinedSummary {
  gameweeks: number[];
  evaluatedAt: string;
  modelVersion: string;
  modelChanges: string[];
  sampleSize: { teamMatches: number; starterSlots: number };
  starterMetrics: StarterMetrics;
  formationMatches: string;
  roleAccuracy: {
    matches: number;
    compared: number;
    laneMismatchesOnCorrectXi: number;
  };
  byGameweek: Array<{
    gameweek: number;
    metrics: StarterMetrics;
    formationMatches: string;
  }>;
  byTeam: Array<{
    teamShort: string;
    gameweeks: number;
    xiHits: number;
    xiMisses: number;
    xiFalsePositives: number;
    formationMatches: number;
    avgXiCorrect: number;
  }>;
  byFplLine: Array<{
    line: string;
    missed: number;
    falsePositives: number;
    correct: number;
  }>;
  repeatMissedStarters: Array<{
    teamShort: string;
    webName: string;
    missedCount: number;
    falsePositiveCount: number;
  }>;
  repeatFalsePositives: Array<{
    teamShort: string;
    webName: string;
    missedCount: number;
    falsePositiveCount: number;
  }>;
}

export function writeFactualReport(
  summary: CombinedSummary,
  rangeLabel: string,
  outDir: string
): string {
  const m = summary.starterMetrics;
  const laneRate =
    summary.roleAccuracy.compared > 0
      ? (
          (summary.roleAccuracy.laneMismatchesOnCorrectXi /
            summary.roleAccuracy.compared) *
          100
        ).toFixed(1)
      : '0';

  const worstTeams = summary.byTeam.slice(0, 5);
  const bestTeams = summary.byTeam.slice(-5).reverse();
  const lines = summary.byFplLine;

  const body = `# Lineup eval — GW${rangeLabel}

Generated: ${summary.evaluatedAt}  
Model: **${summary.modelVersion}**

## Headline metrics

| Metric | Value |
| --- | --- |
| Gameweeks | ${summary.gameweeks.join(', ')} |
| Team-matches | ${summary.sampleSize.teamMatches} |
| XI precision | ${(m.precision * 100).toFixed(1)}% |
| XI recall | ${(m.recall * 100).toFixed(1)}% |
| Correct starters | ${m.correct} / ${summary.sampleSize.starterSlots} |
| Missed (started, not predicted) | ${m.missed} |
| False positive (predicted, benched) | ${m.falsePositives} |
| Formation label vs FPL | ${summary.formationMatches} |
| Lane mismatch (player correct) | ${summary.roleAccuracy.laneMismatchesOnCorrectXi} / ${summary.roleAccuracy.compared} (${laneRate}%) |

## Per gameweek

| GW | Precision | Recall | Formation OK |
| --- | --- | --- | --- |
${summary.byGameweek.map((g) => `| ${g.gameweek} | ${(g.metrics.precision * 100).toFixed(1)}% | ${(g.metrics.recall * 100).toFixed(1)}% | ${g.formationMatches} |`).join('\n')}

## By FPL line (errors)

| Line | Correct | Missed | False positive |
| --- | --- | --- | --- |
${lines.map((l) => `| ${l.line} | ${l.correct} | ${l.missed} | ${l.falsePositives} |`).join('\n')}

## Hardest clubs (avg XI hits / 11 per GW)

| Team | Avg XI | Miss | FP | Formation hits |
| --- | --- | --- | --- | --- |
${worstTeams.map((t) => `| ${t.teamShort} | ${(t.avgXiCorrect * 100).toFixed(0)}% | ${t.xiMisses} | ${t.xiFalsePositives} | ${t.formationMatches}/${t.gameweeks} |`).join('\n')}

## Best clubs

| Team | Avg XI | Miss | FP |
| --- | --- | --- | --- |
${bestTeams.map((t) => `| ${t.teamShort} | ${(t.avgXiCorrect * 100).toFixed(0)}% | ${t.xiMisses} | ${t.xiFalsePositives} |`).join('\n')}

## Repeat missed (≥2 GWs in range)

${summary.repeatMissedStarters.length === 0 ? '_None_' : summary.repeatMissedStarters.map((p) => `- ${p.teamShort} **${p.webName}** (${p.missedCount}×)`).join('\n')}

## Repeat false positive (≥2 GWs in range)

${summary.repeatFalsePositives.length === 0 ? '_None_' : summary.repeatFalsePositives.map((p) => `- ${p.teamShort} **${p.webName}** (${p.falsePositiveCount}×)`).join('\n')}

## Model stack (current code)

${summary.modelChanges.map((c) => `- ${c}`).join('\n')}

## Output files

- \`${outDir}/summary-gw${rangeLabel}.json\`
- \`${outDir}/comparison-gw${rangeLabel}.csv\`
- \`${outDir}/manual-review-gw${rangeLabel}.csv\`

---

_Improvement proposals: see \`IMPROVEMENTS-gw${rangeLabel}.md\` (written by agent per lineup-model-eval skill)._
`;

  return body;
}
