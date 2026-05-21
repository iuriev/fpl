---
name: fpl-squad-viewer-design
description: Use this skill to generate well-branded interfaces and assets for the FPL Squad Viewer — a mobile-first viewer for a Fantasy Premier League team identified by public team ID. Deep-purple surface, neon-green accent, real club kit imagery, football-pitch squad layout. Contains the full token set, CSS variables, UI kit components, and preview cards.
user-invocable: true
---

Read `README.md` first — it lists every file in this folder and explains the
visual foundations, tone, and component inventory.

When making something new:

1. **Pull tokens, don't hand-code values.** Load `tokens.js` (vanilla
   `<script>` → `window.FPL_TOKENS`) or `colors_and_type.css` (CSS vars
   `--fpl-*`). Re-using the existing token names keeps the design coherent.
2. **Lift components from `pitch.jsx` / `screens-v2.jsx`.** They already
   handle the pitch markings, jersey rendering, captain & availability
   badges, summary strip layout. Compose, don't re-draw.
3. **Real shirt images live in `assets/shirts/shirt_{teamCode}.webp`.** The
   `Jersey` component already maps short club codes (`ARS`, `MCI`, …) to
   FPL team codes. If a club is missing a kit, it falls back to an SVG
   silhouette in club colors — flag this to the user and ask for the
   missing file.
4. **For visual artifacts (slides, mocks, prototypes):** copy the assets
   out and produce a static HTML file. Mount React with Babel as in
   `FPL Squad Viewer v2.html` if you need composition power.
5. **For production code:** the tokens map directly to either JS constants
   or CSS variables — both forms stay in sync via `tokens.js` +
   `colors_and_type.css`.

If invoked without other guidance, ask the user what they want to build,
confirm they want this brand applied, then act as an expert designer.
