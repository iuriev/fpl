# Proposal: Standardise FDR Difficulty Colours (DES-04)

## Problem

FDR colours are hardcoded as hex literals in `FdrChip.module.css` with no shared tokens.
The current palette deviates from the widely-recognised community standard:
difficulty 3 is rendered as yellow (associated with "caution") rather than neutral grey,
and difficulty 2 is an aggressive bright green that clashes with the dark app background.
Any future component that needs FDR colouring (fixture calendar, transfer screen FDR
headers, etc.) would have to copy-paste the same hex values, making a global palette change
a multi-file find-and-replace.

## Proposed Changes

1. Add five CSS variable pairs (`--fpl-fdr-N-bg` + `--fpl-fdr-N-ink`) to the global theme
   (`colors_and_type.css`) using the fplukraine.com community palette.
2. Replace the hardcoded hex values in `FdrChip.module.css` with those tokens.

## Target Palette (fplukraine.com)

| Difficulty | Meaning  | Background | Ink        |
|-----------|----------|------------|------------|
| 1         | Easiest  | dark green | light green |
| 2         | Easy     | light green | dark green |
| 3         | Neutral  | grey / off-white | dark  |
| 4         | Hard     | red / pink | white      |
| 5         | Hardest  | dark maroon | light pink |

## Goals

- Single source of truth for all FDR colours — one edit in the theme propagates everywhere.
- Palette matches the fplukraine.com standard that FPL community tools use.

## Non-Goals

- Changing the `FdrChip` component shape, size, or text format.
- Applying FDR colouring to any components other than `FdrChip` (future work).
