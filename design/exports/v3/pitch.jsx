// pitch.jsx — FPL-style pitch layout components
// Jersey, Pitch, PitchPlayer, BenchSlot. No external assets.
// Reads design tokens from window.FPL / window.F_DISP / window.F_MONO,
// which are populated by tokens.js (loaded before this file).

// ─── club kit recipes ────────────────────────────────────────────────
// Real shirt images live in assets/shirts/shirt_<teamCode>.webp
// teamCode = FPL stable team code (ARS=3, AVL=7, CHE=8, EVE=11, NEW=4,
// MCI=43, TOT=6, BRE=94, LIV=14, MUN=1, BHA=36, FUL=54, CRY=31, LEE=2,
// LEI=13, BOU=91, NFO=17, WHU=21, WOL=39, BUR=90).
const CLUB_SHIRT = {
  ARS: 'shirt_3', MCI: 'shirt_43', EVE: 'shirt_11', CHE: 'shirt_8',
};
const CLUB_GK_SHIRT = {
  ARS: 'shirt_3_gk',
};

// Fallback colors (used when we don't have a real shirt image yet).
const FALLBACK_KITS = {
  ARS: { body: '#EF0107', sleeve: '#FFFFFF', collar: '#FFFFFF' },
  MCI: { body: '#6CABDD', sleeve: '#6CABDD', collar: '#1C2C5B' },
  EVE: { body: '#274488', sleeve: '#274488', collar: '#FFFFFF' },
  CHE: { body: '#034694', sleeve: '#034694', collar: '#FFFFFF' },
  AVL: { body: '#7B003A', sleeve: '#7CC2EF', collar: '#FFFFFF' },
  NEW: { body: '#0A0A0A', sleeve: '#FFFFFF', collar: '#FFFFFF', stripe: '#FFFFFF' },
  BRE: { body: '#E30613', sleeve: '#FFFFFF', collar: '#FFFFFF', stripe: '#FFFFFF' },
  TOT: { body: '#FFFFFF', sleeve: '#FFFFFF', collar: '#132257' },
  LIV: { body: '#C8102E', sleeve: '#C8102E', collar: '#FFFFFF' },
  _:   { body: '#888888', sleeve: '#666666', collar: '#FFFFFF' },
};
const FALLBACK_GK = { body: '#FFE600', sleeve: '#D4C200', collar: '#0A0A0A' };

// ─── Jersey ──────────────────────────────────────────────────────────
// Uses real shirt image when available, otherwise a clean SVG fallback
// in the club colors.
function Jersey({ club, isGK = false, size = 56 }) {
  const file = isGK ? (CLUB_GK_SHIRT[club]) : (CLUB_SHIRT[club]);
  if (file) {
    // Native aspect ratio of the shirt assets is ~66:87.
    const h = size;
    const w = Math.round(size * 66 / 87);
    return (
      <img src={`assets/shirts/${file}.webp`}
        width={w} height={h} alt=""
        style={{
          display: 'block', objectFit: 'contain',
          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))',
        }}/>
    );
  }
  return <FallbackShirt club={club} isGK={isGK} size={size}/>;
}

function FallbackShirt({ club, isGK, size }) {
  const k = isGK ? FALLBACK_GK : (FALLBACK_KITS[club] || FALLBACK_KITS._);
  return (
    <svg width={Math.round(size * 66 / 87)} height={size} viewBox="0 0 66 87" style={{ display: 'block' }}>
      <defs>
        <filter id={`fs-${club || 'gk'}-${size}`} x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.4" floodOpacity="0.45"/>
        </filter>
      </defs>
      <g filter={`url(#fs-${club || 'gk'}-${size})`}>
        {/* sleeves */}
        <path d="M9 18 L2 28 L2 44 L13 47 L17 30 Z" fill={k.sleeve}/>
        <path d="M57 18 L64 28 L64 44 L53 47 L49 30 Z" fill={k.sleeve}/>
        {/* body */}
        <path d="M17 18 L26 14 L29 19 L37 19 L40 14 L49 18 L52 78 L46 84 L20 84 L14 78 Z"
              fill={k.body}/>
        {/* stripes (Newcastle/Brentford-style) */}
        {k.stripe && (
          <g>
            <rect x="24" y="14" width="4" height="70" fill={k.stripe}/>
            <rect x="31" y="14" width="4" height="70" fill={k.stripe}/>
            <rect x="38" y="14" width="4" height="70" fill={k.stripe}/>
          </g>
        )}
        {/* collar V */}
        <path d="M29 19 L33 27 L37 19 L36 18 L33 23 L30 18 Z" fill={k.collar}/>
        {/* highlight */}
        <path d="M19 18 L18 80 L21 82 L22 19 Z" fill="rgba(255,255,255,0.10)"/>
      </g>
    </svg>
  );
}

// ─── PitchPlayer (jersey + name + points pills) ──────────────────────
function PitchPlayer({ player, dim = false, jerseySize = 54 }) {
  const isGK = player.pos === 'GK';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 4, opacity: dim ? 0.85 : 1, position: 'relative',
      width: 80,
    }}>
      {player.cap && (
        <div style={{
          position: 'absolute', top: -3, left: 8, zIndex: 2,
          width: 18, height: 18, borderRadius: 999,
          background: player.cap === 'C' ? FPL.capBg : '#FFFFFF',
          color: FPL.capInk, display: 'grid', placeItems: 'center',
          fontFamily: F_DISP, fontWeight: 700, fontSize: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          letterSpacing: '-0.02em', lineHeight: 1,
        }}>{player.cap}</div>
      )}
      {player.status && (
        <AvailBadge status={player.status}/>
      )}
      <Jersey club={player.club} isGK={isGK} size={jerseySize}/>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: FPL.pillBg, borderRadius: 5, overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
        minWidth: 74, marginTop: 2,
      }}>
        <div style={{
          background: FPL.pillBg, color: FPL.pillName,
          fontFamily: F_DISP, fontSize: 11, fontWeight: 600,
          padding: '3px 8px', letterSpacing: '-0.01em',
          width: '100%', textAlign: 'center',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: 92,
        }}>{player.name}</div>
        <div style={{
          background: FPL.accent, color: FPL.capInk,
          fontFamily: F_DISP, fontSize: 11, fontWeight: 700,
          padding: '2px 8px', letterSpacing: '0', minWidth: 30,
          textAlign: 'center', width: '100%',
          fontVariantNumeric: 'tabular-nums',
        }}>{player.pts}</div>
      </div>
    </div>
  );
}

// Availability badge.  status: 'd' doubtful · 'i' injured · 's' suspended · 'u' unavailable
function AvailBadge({ status }) {
  const c = ({
    d: { bg: '#FFC000', fg: '#241500', ch: '!' },     // doubtful (yellow)
    i: { bg: '#FF4D6D', fg: '#FFFFFF', ch: '+' },     // injured (red) — '+' = first-aid
    s: { bg: '#FF4D6D', fg: '#FFFFFF', ch: '!' },     // suspended (red)
    u: { bg: '#FF4D6D', fg: '#FFFFFF', ch: '×' },     // unavailable (red)
  })[status] || { bg: '#FFC000', fg: '#241500', ch: '!' };
  return (
    <div style={{
      position: 'absolute', top: -3, right: 8, zIndex: 2,
      width: 18, height: 18, borderRadius: 999,
      background: c.bg, color: c.fg, display: 'grid', placeItems: 'center',
      fontFamily: F_DISP, fontWeight: 800, fontSize: status === 'i' ? 13 : 11,
      lineHeight: 1, letterSpacing: '-0.02em',
      boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      border: '1.5px solid #220035',
    }}>{c.ch}</div>
  );
}

// ─── Pitch background ────────────────────────────────────────────────
function PitchBg({ width = 358, height = 480 }) {
  // Pitch is rectangle with markings. 8 horizontal grass stripes.
  const stripeH = height / 8;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', inset: 0, borderRadius: 8 }}>
      {/* grass stripes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x="0" y={i * stripeH} width={width} height={stripeH}
          fill={i % 2 === 0 ? FPL.pitchA : FPL.pitchB}/>
      ))}
      {/* outer line */}
      <rect x="4" y="4" width={width - 8} height={height - 8}
        fill="none" stroke={FPL.pitchLine} strokeWidth="2"/>
      {/* halfway */}
      <line x1="4" y1={height / 2} x2={width - 4} y2={height / 2}
        stroke={FPL.pitchLine} strokeWidth="2"/>
      <circle cx={width / 2} cy={height / 2} r="38"
        fill="none" stroke={FPL.pitchLine} strokeWidth="2"/>
      <circle cx={width / 2} cy={height / 2} r="2" fill={FPL.pitchLine}/>
      {/* top penalty area (defending) */}
      <rect x={(width - 180) / 2} y="4" width="180" height="56"
        fill="none" stroke={FPL.pitchLine} strokeWidth="2"/>
      <rect x={(width - 84) / 2} y="4" width="84" height="22"
        fill="none" stroke={FPL.pitchLine} strokeWidth="2"/>
      {/* top penalty arc */}
      <path d={`M ${width/2 - 28} 60 A 28 28 0 0 0 ${width/2 + 28} 60`}
        fill="none" stroke={FPL.pitchLine} strokeWidth="2"/>
      {/* top goal */}
      <rect x={(width - 48) / 2} y="0" width="48" height="4"
        fill="rgba(255,255,255,0.85)"/>
      {/* bottom penalty area (attacking) */}
      <rect x={(width - 180) / 2} y={height - 60} width="180" height="56"
        fill="none" stroke={FPL.pitchLine} strokeWidth="2"/>
      <rect x={(width - 84) / 2} y={height - 26} width="84" height="22"
        fill="none" stroke={FPL.pitchLine} strokeWidth="2"/>
      {/* bottom penalty arc */}
      <path d={`M ${width/2 - 28} ${height - 60} A 28 28 0 0 1 ${width/2 + 28} ${height - 60}`}
        fill="none" stroke={FPL.pitchLine} strokeWidth="2"/>
      {/* corners */}
      <path d="M 4 4 A 6 6 0 0 0 10 10" fill="none" stroke={FPL.pitchLine} strokeWidth="2"/>
      <path d={`M ${width - 4} 4 A 6 6 0 0 1 ${width - 10} 10`} fill="none" stroke={FPL.pitchLine} strokeWidth="2"/>
      <path d={`M 4 ${height - 4} A 6 6 0 0 1 10 ${height - 10}`} fill="none" stroke={FPL.pitchLine} strokeWidth="2"/>
      <path d={`M ${width - 4} ${height - 4} A 6 6 0 0 0 ${width - 10} ${height - 10}`} fill="none" stroke={FPL.pitchLine} strokeWidth="2"/>
    </svg>
  );
}

// ─── Pitch (with players overlaid in rows) ───────────────────────────
function Pitch({ starters, width = 358, height = 480 }) {
  // Group by position. Team attacks UP: FWD at top, GK at bottom
  // (matches the official FPL pitch convention).
  const gk  = starters.filter(p => p.pos === 'GK');
  const def = starters.filter(p => p.pos === 'DEF');
  const mid = starters.filter(p => p.pos === 'MID');
  const fwd = starters.filter(p => p.pos === 'FWD');
  const rows = [fwd, mid, def, gk];
  // Vertical positions (as % of pitch height), top → bottom
  const rowYs = [0.07, 0.31, 0.55, 0.79];

  return (
    <div style={{ position: 'relative', width, height }}>
      <PitchBg width={width} height={height}/>
      {rows.map((row, ri) => (
        <div key={ri} style={{
          position: 'absolute',
          top: `${rowYs[ri] * 100}%`,
          left: 0, right: 0,
          display: 'flex', justifyContent: 'space-around',
          alignItems: 'flex-start',
          padding: '0 8px',
        }}>
          {row.map((p, i) => (
            <PitchPlayer key={`${ri}-${i}`} player={p}/>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Bench strip ─────────────────────────────────────────────────────
function BenchStrip({ bench }) {
  // Label format: GKP, 1.OUT, 2.OUT, 3.OUT (position of the outfield slot)
  const labels = ['GKP', '1', '2', '3'];
  return (
    <div style={{
      margin: '12px 16px 0',
      background: 'rgba(0,0,0,0.28)',
      border: `1px solid ${FPL.bgHair}`,
      borderRadius: 10, padding: '12px 8px 14px',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
        marginBottom: 8,
      }}>
        {bench.map((p, i) => {
          const isGK = p.pos === 'GK';
          const lbl = isGK ? 'GKP' : `${i}. ${p.pos}`;
          return (
            <div key={i} style={{
              textAlign: 'center', fontFamily: F_DISP, fontSize: 10.5,
              color: FPL.textSoft, fontWeight: 600, letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              textDecorationColor: 'rgba(255,255,255,0.4)',
            }}>{lbl}</div>
          );
        })}
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
      }}>
        {bench.map((p, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
            <PitchPlayer player={p} jerseySize={48}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton for pitch / bench ──────────────────────────────────────
function PitchPlayerSkeleton({ jerseySize = 54 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: jerseySize, height: jerseySize, borderRadius: 8,
        background: 'rgba(255,255,255,0.08)',
        animation: 'fplShimmer 1.6s ease-in-out infinite',
        backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.06) 100%)',
        backgroundSize: '200% 100%',
      }}/>
      <div style={{
        width: 74, height: 32, borderRadius: 5, marginTop: 2,
        background: 'rgba(255,255,255,0.10)',
        animation: 'fplShimmer 1.6s ease-in-out infinite',
        backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 100%)',
        backgroundSize: '200% 100%',
      }}/>
    </div>
  );
}

function PitchSkeleton({ width = 358, height = 480 }) {
  const rowYs = [0.07, 0.31, 0.55, 0.79];
  // FWD, MID, DEF, GK (top → bottom)
  const counts = [2, 4, 4, 1];
  return (
    <div style={{ position: 'relative', width, height }}>
      <PitchBg width={width} height={height}/>
      {/* dark veil to indicate loading */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 8,
        background: 'rgba(0,0,0,0.20)',
      }}/>
      {counts.map((n, ri) => (
        <div key={ri} style={{
          position: 'absolute', top: `${rowYs[ri] * 100}%`, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-around',
          alignItems: 'flex-start', padding: '0 8px',
        }}>
          {Array.from({ length: n }).map((_, i) => (
            <PitchPlayerSkeleton key={i}/>
          ))}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  FPL, F_DISP, F_MONO,
  Jersey, FallbackShirt, AvailBadge,
  PitchPlayer, PitchBg, Pitch, BenchStrip,
  PitchPlayerSkeleton, PitchSkeleton,
});
