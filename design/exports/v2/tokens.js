// tokens.js — FPL Squad Viewer design tokens (single source of truth)
// Loaded as a vanilla <script> so it can populate window.FPL_TOKENS for
// downstream consumers (pitch.jsx, screens.jsx, design-system previews).
// The matching CSS-variable form lives in colors_and_type.css.

window.FPL_TOKENS = (() => {

  // ─── COLORS ────────────────────────────────────────────────────────
  const color = {
    // Surface (deep purple stack — outer → inner)
    bgDeep:    '#170027',  // viewport / outside-card
    bg:        '#220035',  // primary surface
    bgSoft:    '#2D0844',  // raised cards
    bgHair:    '#3D1A55',  // hairline borders, capsule fill

    // Pitch
    pitchA:    '#1FA64B',  // grass stripe (lighter)
    pitchB:    '#17933E',  // grass stripe (darker)
    pitchLine: 'rgba(255,255,255,0.70)',

    // Text
    text:      '#FFFFFF',
    textSoft:  '#E8E0F0',
    muted:     '#A89BBA',
    mutedSoft: '#7A6B8E',
    inkOnAccent: '#170027',  // dark text used ON the green accent

    // Brand accent
    accent:     '#00FF87',  // FPL signature green
    accentDeep: '#04E36A',
    accentInk:  '#170027',

    // Semantic
    error:     '#FF4D6D',
    errorSoft: 'rgba(255,77,109,0.12)',
    warn:      '#FFC000',
    warnInk:   '#241500',

    // Availability flag colors (semantic aliases)
    statusDoubtful:    '#FFC000',
    statusDoubtfulInk: '#241500',
    statusUnavailable: '#FF4D6D',
    statusUnavailableInk: '#FFFFFF',

    // Player pill
    pillBg:       '#3D1A55',
    pillNameInk:  '#FFFFFF',
    pillPtsBg:    '#00FF87',
    pillPtsInk:   '#170027',
  };

  // ─── POSITION COLORS ──────────────────────────────────────────────
  // Used in PositionBadge. CSS-var form: --fpl-pos-{pos}-{bg|fg}.
  const positionColor = {
    gk:  { bg: '#FFE600', fg: '#241500' },
    def: { bg: '#3DB1FF', fg: '#001F2E' },
    mid: { bg: color.accent, fg: color.accentInk },
    fwd: { bg: '#FF4D6D', fg: '#FFFFFF' },
  };

  // ─── TYPOGRAPHY ────────────────────────────────────────────────────
  const font = {
    display: '"Space Grotesk", -apple-system, system-ui, sans-serif',
    mono:    '"JetBrains Mono", ui-monospace, "SF Mono", monospace',
  };

  // Size scale (px). Names map to roles, not arbitrary t-shirt sizes.
  const fontSize = {
    micro:    10,    // overline tag inside skeletons
    cap:      11,    // overline label, club code, pill text
    bodyXs:   12,    // form labels (uppercase)
    bodyS:    13,    // helper / error inline
    body:     14,    // small button, change link
    bodyM:    15,    // explainer
    bodyL:    16,    // header team name, primary button
    title:    17,    // gameweek title
    titleL:   18,    // input value
    h3:       22,    // empty-state H3, summary TOTAL value
    h2:       28,    // section title
    h1:       38,    // entry headline (sm)
    h1L:      40,    // entry headline (default)
  };

  // Font weight scale
  const fontWeight = {
    regular: 400,
    medium:  500,
    semibold:600,
    bold:    700,
    heavy:   800,
  };

  // Line heights (used most often as multipliers)
  const lineHeight = {
    tight: 1.0,
    snug:  1.15,
    normal:1.45,
    relaxed:1.5,
  };

  // Letter spacing — name maps to use-case
  const tracking = {
    headXl:  '-0.035em',   // H1 hero
    headL:   '-0.02em',    // H3
    headM:   '-0.015em',   // team name
    headS:   '-0.01em',    // button, body emphasized
    body:    '0',
    capS:    '0.04em',     // club mono code
    capM:    '0.06em',     // form label uppercase
    capL:    '0.10em',     // strip cell label
    capXl:   '0.12em',     // section overline
  };

  // ─── SPACING ───────────────────────────────────────────────────────
  // Multiplicative-feeling but written out for clarity. Use whole numbers.
  const space = {
    xs:  4,
    s:   6,
    sm:  8,
    md:  10,
    base:12,
    lg:  14,
    xl:  16,
    xl2: 18,
    xl3: 20,
    xl4: 24,
    xl5: 28,
    xl6: 32,
    xl7: 40,
    xl8: 48,
    xl9: 56,
  };

  // ─── RADII ─────────────────────────────────────────────────────────
  const radius = {
    xs:    4,
    s:     5,
    sm:    6,
    md:    8,
    lg:    10,
    xl:    12,   // inputs, primary buttons, cards
    xl2:   14,
    xl3:   18,
    pill:  999,
  };

  // ─── ELEVATION (box-shadows) ───────────────────────────────────────
  const shadow = {
    pillSoft:   '0 2px 6px rgba(0,0,0,0.35)',
    pillFirm:   '0 2px 6px rgba(0,0,0,0.45)',
    statusDot:  '0 1px 3px rgba(0,0,0,0.40)',
    focusRing:  (rgba) => `0 0 0 3px ${rgba}`,
  };
  // Drop-shadow filter for shirts (separate so it works in SVG/img)
  const dropShadow = {
    shirt:  'drop-shadow(0 2px 3px rgba(0,0,0,0.45))',
  };

  // ─── HIT TARGETS / ELEMENT SIZES ───────────────────────────────────
  const size = {
    inputH:        56,    // text input / primary button height
    btnH:          44,    // secondary / pill button
    arrowBtn:      36,    // GW nav arrow
    avatar:        28,    // small logo
    avatarM:       32,    // medium logo
    statusBadge:   18,    // captain / availability dot
    jerseyL:       54,    // pitch player jersey
    jerseyM:       48,    // bench jersey
    homeIndicator: 5,
    statusBar:     47,
  };

  // ─── MOTION ────────────────────────────────────────────────────────
  const motion = {
    fast:   '120ms cubic-bezier(.2,.7,.3,1)',
    base:   '150ms cubic-bezier(.2,.7,.3,1)',
    slow:   '240ms cubic-bezier(.2,.7,.3,1)',
    shimmer:'fplShimmer 1.6s ease-in-out infinite',
  };

  return {
    color, positionColor, font, fontSize, fontWeight, lineHeight, tracking,
    space, radius, shadow, dropShadow, size, motion,
  };
})();

// Convenience: legacy aliases so existing files keep working without churn
window.FPL = window.FPL || {
  bgDeep:    window.FPL_TOKENS.color.bgDeep,
  bg:        window.FPL_TOKENS.color.bg,
  bgSoft:    window.FPL_TOKENS.color.bgSoft,
  bgHair:    window.FPL_TOKENS.color.bgHair,
  pitchA:    window.FPL_TOKENS.color.pitchA,
  pitchB:    window.FPL_TOKENS.color.pitchB,
  pitchLine: window.FPL_TOKENS.color.pitchLine,
  text:      window.FPL_TOKENS.color.text,
  textSoft:  window.FPL_TOKENS.color.textSoft,
  muted:     window.FPL_TOKENS.color.muted,
  mutedSoft: window.FPL_TOKENS.color.mutedSoft,
  accent:    window.FPL_TOKENS.color.accent,
  accentDeep:window.FPL_TOKENS.color.accentDeep,
  pillBg:    window.FPL_TOKENS.color.pillBg,
  pillName:  window.FPL_TOKENS.color.pillNameInk,
  pillPts:   window.FPL_TOKENS.color.pillPtsBg,
  capBg:     window.FPL_TOKENS.color.accent,
  capInk:    window.FPL_TOKENS.color.inkOnAccent,
  error:     window.FPL_TOKENS.color.error,
  errorSoft: window.FPL_TOKENS.color.errorSoft,
};
window.F_DISP = window.FPL_TOKENS.font.display;
window.F_MONO = window.FPL_TOKENS.font.mono;
