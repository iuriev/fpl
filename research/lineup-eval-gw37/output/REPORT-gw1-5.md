# Lineup eval — GW1-5

Generated: 2026-06-04T17:10:01.938Z  
Model: **lineup-v5**

## Headline metrics

| Metric | Value |
| --- | --- |
| Gameweeks | 1, 2, 3, 4, 5 |
| Team-matches | 100 |
| XI precision | 62.8% |
| XI recall | 63.6% |
| Correct starters | 689 / 1100 |
| Missed (started, not predicted) | 394 |
| False positive (predicted, benched) | 409 |
| Formation label vs FPL | 26/100 |
| Lane mismatch (player correct) | 111 / 603 (18.4%) |

## Per gameweek

| GW | Precision | Recall | Formation OK |
| --- | --- | --- | --- |
| 1 | 41.3% | 42.3% | 0/20 |
| 2 | 69.5% | 70.8% | 5/20 |
| 3 | 68.6% | 69.6% | 7/20 |
| 4 | 62.7% | 63.0% | 5/20 |
| 5 | 71.4% | 72.0% | 9/20 |

## By FPL line (errors)

| Line | Correct | Missed | False positive |
| --- | --- | --- | --- |
| MID | 244 | 228 | 174 |
| DEF | 283 | 132 | 139 |
| FWD | 76 | 19 | 82 |
| GK | 86 | 15 | 14 |

## Hardest clubs (avg XI hits / 11 per GW)

| Team | Avg XI | Miss | FP | Formation hits |
| --- | --- | --- | --- | --- |
| WOL | 42% | 30 | 32 | 0/5 |
| MCI | 49% | 26 | 28 | 2/5 |
| WHU | 53% | 21 | 26 | 0/5 |
| LEE | 55% | 25 | 25 | 3/5 |
| MUN | 55% | 25 | 25 | 1/5 |

## Best clubs

| Team | Avg XI | Miss | FP |
| --- | --- | --- | --- |
| BRE | 82% | 10 | 10 |
| NFO | 76% | 12 | 13 |
| EVE | 71% | 16 | 16 |
| ARS | 71% | 18 | 15 |
| LIV | 69% | 17 | 17 |

## Repeat missed (≥2 GWs in range)

- BUR **Cullen** (5×)
- BOU **Scott** (5×)
- BHA **Mitoma** (5×)
- CRY **Richards** (5×)
- EVE **Gana** (5×)
- FUL **Andersen** (5×)
- LEE **Gudmundsson** (5×)
- LEE **Stach** (5×)
- LIV **Ekitiké** (5×)
- MUN **De Ligt** (5×)
- NEW **Livramento** (5×)
- SUN **Talbi** (5×)
- TOT **Romero** (5×)
- TOT **Kudus** (5×)
- WHU **L.Paquetá** (5×)
- WOL **Agbadou** (5×)
- LIV **Mac Allister** (4×)
- NEW **Schär** (4×)
- NFO **Murillo** (4×)
- NFO **Hudson-Odoi** (4×)
- EVE **Grealish** (4×)
- FUL **Sessegnon** (4×)
- MUN **Amad** (4×)
- ARS **Rice** (3×)
- AVL **Kamara** (3×)

## Repeat false positive (≥2 GWs in range)

- AVL **Bailey** (5×)
- AVL **Sancho** (5×)
- FUL **Robinson** (5×)
- LIV **Isak** (5×)
- MCI **Semenyo** (5×)
- MCI **Guéhi** (5×)
- TOT **Kolo Muani** (5×)
- WHU **Taty** (5×)
- WHU **Disasi** (5×)
- WOL **Mané** (5×)
- FUL **J.Cuenca** (4×)
- LEE **Byram** (4×)
- MUN **Zirkzee** (4×)
- NEW **Hall** (4×)
- WOL **Armstrong** (4×)
- BUR **Ward-Prowse** (4×)
- LIV **Frimpong** (4×)
- SUN **Angulo** (4×)
- TOT **Gallagher** (4×)
- TOT **Souza** (4×)
- BOU **Kroupi.Jr** (3×)
- BRE **O.Dango** (3×)
- BHA **F.Kadıoğlu** (3×)
- CHE **Hato** (3×)
- CRY **Clyne** (3×)

## Model stack (current code)

- v5 GW1 preseason score cap + keep prior-season formation on GW1
- v5 FWD bench gate 0.35 + 3-match bench streak (0.5/0.2)
- v5 MID rotation gap: skip close scores without last start

## Output files

- `output/summary-gw1-5.json`
- `output/comparison-gw1-5.csv`
- `output/manual-review-gw1-5.csv`

---

_Improvement proposals: see `IMPROVEMENTS-gw1-5.md` (written by agent per lineup-model-eval skill)._
