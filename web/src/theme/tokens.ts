/**
 * Design tokens (TypeScript).
 * Mirrors CSS variables in colors_and_type.css.
 * Used when JS needs a value (e.g., SVG drawing).
 * Keep in sync with the CSS variables.
 */

export const tokens = {
  // ─── Colors ────────────────────────────────────────────────────────
  color: {
    // Surface (deep purple stack — outer → inner)
    bgDeep: '#170027',
    bg: '#220035',
    bgSoft: '#2D0844',
    bgHair: '#3D1A55',

    // Pitch
    pitchA: '#1FA64B',
    pitchB: '#17933E',
    pitchLine: 'rgba(255,255,255,0.70)',

    // Text
    text: '#FFFFFF',
    textSoft: '#E8E0F0',
    muted: '#A89BBA',
    mutedSoft: '#7A6B8E',

    // Brand accent
    accent: '#00FF87',
    accentDeep: '#04E36A',
    accentInk: '#170027',

    // Semantic
    error: '#FF4D6D',
    errorSoft: 'rgba(255,77,109,0.12)',
    warn: '#FFC000',
    warnInk: '#241500',

    // Player pill
    pillBg: '#3D1A55',
    pillNameInk: '#FFFFFF',
    pillPtsBg: '#00FF87',
    pillPtsInk: '#170027',
  },

  // ─── Typography ────────────────────────────────────────────────────
  font: {
    display: '"Space Grotesk", -apple-system, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, "SF Mono", monospace',
  },

  fontSize: {
    micro: 10,
    cap: 11,
    bodyXs: 12,
    bodyS: 13,
    body: 14,
    bodyM: 15,
    bodyL: 16,
    title: 17,
    titleL: 18,
    h3: 22,
    h2: 28,
    h1: 38,
    h1L: 40,
  },

  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    heavy: 800,
  },

  lineHeight: {
    tight: 1.0,
    snug: 1.15,
    normal: 1.45,
    relaxed: 1.5,
  },

  tracking: {
    headXl: '-0.035em',
    headL: '-0.02em',
    headM: '-0.015em',
    headS: '-0.01em',
    body: '0',
    capS: '0.04em',
    capM: '0.06em',
    capL: '0.10em',
    capXl: '0.12em',
  },

  // ─── Spacing ───────────────────────────────────────────────────────
  space: {
    xs: 4,
    s: 6,
    sm: 8,
    md: 10,
    base: 12,
    lg: 14,
    xl: 16,
    xl2: 18,
    xl3: 20,
    xl4: 24,
    xl5: 28,
    xl6: 32,
    xl7: 40,
    xl8: 48,
    xl9: 56,
  },

  // ─── Radii ─────────────────────────────────────────────────────────
  radius: {
    xs: 4,
    s: 5,
    sm: 6,
    md: 8,
    lg: 10,
    xl: 12,
    xl2: 14,
    xl3: 18,
    pill: 999,
  },

  // ─── Elevation ─────────────────────────────────────────────────────
  shadow: {
    pillSoft: '0 2px 6px rgba(0,0,0,0.35)',
    pillFirm: '0 2px 6px rgba(0,0,0,0.45)',
    statusDot: '0 1px 3px rgba(0,0,0,0.40)',
  },

  dropShadow: {
    shirt: 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))',
  },

  // ─── Sizes ─────────────────────────────────────────────────────────
  size: {
    inputH: 56,
    btnH: 44,
    arrowBtn: 36,
    avatar: 28,
    avatarM: 32,
    statusBadge: 18,
    jerseyL: 54,
    jerseyM: 48,
    homeIndicator: 5,
    statusBar: 47,
  },
};
