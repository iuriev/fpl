# Lineup eval — GW10

Generated: 2026-06-04T16:41:53.602Z  
Model: **lineup-v5**

## Headline metrics

| Metric | Value |
| --- | --- |
| Gameweeks | 10 |
| Team-matches | 20 |
| XI precision | 77.3% |
| XI recall | 78.0% |
| Correct starters | 170 / 220 |
| Missed (started, not predicted) | 48 |
| False positive (predicted, benched) | 50 |
| Formation label vs FPL | 8/20 |
| Lane mismatch (player correct) | 21 / 151 (13.9%) |

## Per gameweek

| GW | Precision | Recall | Formation OK |
| --- | --- | --- | --- |
| 10 | 77.3% | 78.0% | 8/20 |

## By FPL line (errors)

| Line | Correct | Missed | False positive |
| --- | --- | --- | --- |
| MID | 70 | 26 | 21 |
| DEF | 64 | 18 | 22 |
| FWD | 17 | 3 | 6 |
| GK | 19 | 1 | 1 |

## Hardest clubs (avg XI hits / 11 per GW)

| Team | Avg XI | Miss | FP | Formation hits |
| --- | --- | --- | --- | --- |
| WOL | 36% | 6 | 7 | 0/1 |
| FUL | 55% | 5 | 5 | 0/1 |
| LIV | 55% | 5 | 5 | 1/1 |
| NFO | 64% | 4 | 4 | 0/1 |
| CRY | 73% | 2 | 3 | 0/1 |

## Best clubs

| Team | Avg XI | Miss | FP |
| --- | --- | --- | --- |
| BRE | 100% | 0 | 0 |
| ARS | 100% | 0 | 0 |
| MUN | 91% | 1 | 1 |
| CHE | 91% | 1 | 1 |
| BHA | 91% | 1 | 1 |

## Repeat missed (≥2 GWs in range)

_None_

## Repeat false positive (≥2 GWs in range)

_None_

## Model stack (current code)

- v5 GW1 preseason score cap + keep prior-season formation on GW1
- v5 FWD bench gate 0.35 + 3-match bench streak (0.5/0.2)
- v5 MID rotation gap: skip close scores without last start

## Output files

- `output/summary-gw10.json`
- `output/comparison-gw10.csv`
- `output/manual-review-gw10.csv`

---

_Improvement proposals: see `IMPROVEMENTS-gw10.md` (written by agent per lineup-model-eval skill)._
