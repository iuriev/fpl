// screens-v2.jsx — FPL Squad Viewer (dark FPL palette + pitch layout)

// Data (extends starters/bench from screens.jsx if loaded, otherwise inline)
const V2_STARTERS = [
  { pos: 'GK',  name: 'Raya',       club: 'ARS', pts: 6  },
  { pos: 'DEF', name: 'White',      club: 'ARS', pts: 4  },
  { pos: 'DEF', name: 'Saliba',     club: 'ARS', pts: 8  },
  { pos: 'DEF', name: 'Gabriel',    club: 'ARS', pts: 9  },
  { pos: 'DEF', name: 'Mykolenko',  club: 'EVE', pts: 2,  status: 'i' },
  { pos: 'MID', name: 'Saka',       club: 'ARS', pts: 14, cap: 'C' },
  { pos: 'MID', name: 'Ødegaard',   club: 'ARS', pts: 7,  cap: 'V' },
  { pos: 'MID', name: 'Rodri',      club: 'MCI', pts: 10 },
  { pos: 'MID', name: 'Martinelli', club: 'ARS', pts: 5,  status: 'd' },
  { pos: 'FWD', name: 'Watkins',    club: 'AVL', pts: 11 },
  { pos: 'FWD', name: 'Isak',       club: 'NEW', pts: 15 },
];
const V2_BENCH = [
  { pos: 'GK',  name: 'Flekken',     club: 'BRE', pts: 3 },
  { pos: 'DEF', name: 'Trippier',    club: 'NEW', pts: 4 },
  { pos: 'DEF', name: 'Pedro Porro', club: 'TOT', pts: 6 },
  { pos: 'MID', name: 'Mbeumo',      club: 'BRE', pts: 5 },
];
const V2_TOTAL = V2_STARTERS.reduce((s,p) => s + (p.cap === 'C' ? p.pts*2 : p.pts), 0);
const V2_TRANSFER_HIT = 4;
const V2_NET_POINTS = V2_TOTAL - V2_TRANSFER_HIT;
const V2_SUMMARY = {
  total:     V2_NET_POINTS,
  average:   51,
  highest:   142,
  rank:      '1.2M',
  transfers: '2 (−4)',
};

// ─── status bar / home indicator (light variant for dark bg) ────────
function StatusBarV2({ light = true }) {
  const c = light ? '#fff' : '#000';
  return (
    <div style={{
      height: 47, padding: '0 28px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
      fontFamily: '-apple-system, "SF Pro", system-ui',
      fontWeight: 600, fontSize: 15, color: c, flexShrink: 0,
    }}>
      <span style={{ letterSpacing: '-0.01em' }}>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="17" height="11" viewBox="0 0 17 11">
          <rect x="0"  y="7" width="3" height="4" rx="0.6" fill={c}/>
          <rect x="4.5"y="5" width="3" height="6" rx="0.6" fill={c}/>
          <rect x="9"  y="2.5" width="3" height="8.5" rx="0.6" fill={c}/>
          <rect x="13.5" y="0" width="3" height="11" rx="0.6" fill={c}/>
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11">
          <path d="M7.5 3C9.4 3 11.2 3.7 12.5 5L13.5 4C11.9 2.4 9.8 1.5 7.5 1.5C5.2 1.5 3.1 2.4 1.5 4L2.5 5C3.8 3.7 5.6 3 7.5 3Z" fill={c}/>
          <path d="M7.5 6C8.6 6 9.7 6.5 10.5 7.3L11.5 6.3C10.4 5.2 9 4.5 7.5 4.5C6 4.5 4.6 5.2 3.5 6.3L4.5 7.3C5.3 6.5 6.4 6 7.5 6Z" fill={c}/>
          <circle cx="7.5" cy="9" r="1.3" fill={c}/>
        </svg>
        <svg width="25" height="11" viewBox="0 0 25 11">
          <rect x="0.5" y="0.5" width="21" height="10" rx="2.5" stroke={c} strokeOpacity="0.4" fill="none"/>
          <rect x="2" y="2" width="18" height="7" rx="1.2" fill={c}/>
          <path d="M23 3.6V7.4C23.6 7.2 24 6.7 24 6C24 5.3 23.6 4.8 23 4.6V3.6Z" fill={c} fillOpacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}
function HomeIndicatorV2({ light = true }) {
  return (
    <div style={{
      height: 34, display: 'flex', alignItems: 'flex-end',
      justifyContent: 'center', paddingBottom: 8, flexShrink: 0,
    }}>
      <div style={{
        width: 134, height: 5, borderRadius: 3,
        background: light ? '#fff' : '#0E1112',
      }}/>
    </div>
  );
}

// frame in FPL dark palette
function V2Frame({ children }) {
  return (
    <div style={{
      width: 390, height: 844, background: FPL.bgDeep, color: FPL.text,
      fontFamily: F_DISP, position: 'relative',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

// ─── Logo mark ──────────────────────────────────────────────────────
function FPLMark({ size = 30 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 8, background: FPL.accent,
      display: 'grid', placeItems: 'center',
    }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 20 20" fill="none">
        <path d="M3 17 L7 3 L11 3 L9 9 L13 9 L11 13 L15 13 L9 19 L11 13" stroke={FPL.bgDeep} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
      </svg>
    </div>
  );
}

// ─── ENTRY SCREEN V2 ────────────────────────────────────────────────
function EntryScreenV2({ state = 'idle' }) {
  const isInvalid = state === 'invalid';
  const isNotFound = state === 'notFound';
  const value = isInvalid ? '12abc34' : isNotFound ? '9999999' : '';
  const buttonEnabled = isNotFound;
  const showError = isInvalid || isNotFound;
  const errorMsg = isInvalid
    ? 'Please enter a valid team ID (numbers only).'
    : "We couldn't find a team with that ID. Please check and try again.";

  return (
    <V2Frame>
      <StatusBarV2/>
      <div style={{ flex: 1, padding: '24px 24px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <FPLMark/>
          <span style={{
            fontFamily: F_DISP, fontSize: 13, fontWeight: 600,
            color: FPL.muted, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>Squad Viewer</span>
        </div>

        <div style={{ marginTop: 52 }}>
          <h1 style={{
            margin: 0, fontFamily: F_DISP, fontWeight: 700,
            fontSize: 40, lineHeight: 1.02, letterSpacing: '-0.035em',
            color: FPL.text,
          }}>
            Your squad.<br/>
            <span style={{ color: FPL.accent }}>Every gameweek.</span>
          </h1>
          <p style={{
            margin: '14px 0 0', fontFamily: F_DISP, fontSize: 15,
            color: FPL.muted, lineHeight: 1.5, fontWeight: 400, maxWidth: 320,
          }}>
            See your FPL squad and points — just enter your team ID. No login, no fuss.
          </p>
        </div>

        <div style={{ marginTop: 40 }}>
          <label style={{
            display: 'block', fontFamily: F_DISP, fontSize: 11,
            fontWeight: 700, color: FPL.muted, letterSpacing: '0.10em',
            textTransform: 'uppercase', marginBottom: 8,
          }}>Team ID</label>

          <div style={{
            display: 'flex', alignItems: 'center', height: 56,
            borderRadius: 12, background: FPL.bg,
            border: `1.5px solid ${showError ? FPL.error : FPL.bgHair}`,
            padding: '0 18px',
            boxShadow: showError ? `0 0 0 3px ${FPL.errorSoft}` : 'none',
            transition: 'all .15s',
          }}>
            {value ? (
              <span style={{
                fontFamily: F_MONO, fontSize: 18,
                color: isInvalid ? FPL.error : FPL.text,
                letterSpacing: '0.01em', fontVariantNumeric: 'tabular-nums',
              }}>{value}<span style={{
                display: 'inline-block', width: 1.5, height: 20,
                background: FPL.accent, marginLeft: 2,
                verticalAlign: 'middle', opacity: 0.8,
              }}/></span>
            ) : (
              <span style={{
                fontFamily: F_MONO, fontSize: 18, color: FPL.mutedSoft,
                letterSpacing: '0.01em', whiteSpace: 'nowrap',
              }}>e.g. 1234567</span>
            )}
          </div>

          <div style={{ marginTop: 10, minHeight: 44 }}>
            {showError ? (
              <div style={{
                display: 'flex', gap: 6, alignItems: 'flex-start',
                fontFamily: F_DISP, fontSize: 13, color: FPL.error,
                fontWeight: 500, lineHeight: 1.45,
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0, marginTop: 2 }}>
                  <circle cx="7" cy="7" r="6.3" fill={FPL.error}/>
                  <path d="M7 3.5v4M7 9.5v.1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                <span>{errorMsg}</span>
              </div>
            ) : (
              <p style={{ margin: 0, fontFamily: F_DISP, fontSize: 13, color: FPL.muted, lineHeight: 1.5 }}>
                Find your ID in the FPL URL:<br/>
                <span style={{ fontFamily: F_MONO, fontSize: 11.5, color: FPL.textSoft }}>
                  fantasy.premierleague.com/entry/<span style={{ color: FPL.accent }}>{'{ID}'}</span>/event/<span style={{ color: FPL.accent }}>{'{GW}'}</span>
                </span>
              </p>
            )}
          </div>
        </div>

        <button style={{
          marginTop: 18, height: 56, borderRadius: 12, border: 'none',
          background: buttonEnabled ? FPL.accent : FPL.bgSoft,
          color: buttonEnabled ? FPL.bgDeep : FPL.mutedSoft,
          fontFamily: F_DISP, fontSize: 16, fontWeight: 700,
          letterSpacing: '-0.01em', cursor: buttonEnabled ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all .15s', whiteSpace: 'nowrap',
        }}>
          View squad
          {buttonEnabled && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8m-3-3l3 3-3 3" stroke={FPL.bgDeep} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        <div style={{ flex: 1 }}/>
        <p style={{
          textAlign: 'center', fontFamily: F_DISP, fontSize: 11,
          color: FPL.mutedSoft, marginBottom: 14, fontWeight: 500,
          letterSpacing: '0.02em',
        }}>
          Unofficial fan-made viewer · v0.3
        </p>
      </div>
      <HomeIndicatorV2/>
    </V2Frame>
  );
}

// ─── SQUAD HEADER / GW CONTROL (v2) ─────────────────────────────────
function SquadHeaderV2({ teamName, loading }) {
  return (
    <div style={{
      padding: '10px 20px 12px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'transparent',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        <FPLMark size={28}/>
        {loading ? (
          <div style={{
            width: 130, height: 18, borderRadius: 4,
            background: 'rgba(255,255,255,0.10)',
            animation: 'fplShimmer 1.6s ease-in-out infinite',
            backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 100%)',
            backgroundSize: '200% 100%',
          }}/>
        ) : (
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: F_DISP, fontSize: 16, fontWeight: 700,
              color: FPL.text, letterSpacing: '-0.015em', lineHeight: 1.15,
              whiteSpace: 'nowrap',
            }}>{teamName}</div>
            <div style={{
              fontFamily: F_MONO, fontSize: 10, color: FPL.mutedSoft,
              fontWeight: 500, letterSpacing: '0.04em', marginTop: 1,
            }}>ID · 1234567</div>
          </div>
        )}
      </div>
      <button style={{
        background: 'transparent', border: 'none', padding: '6px 4px',
        fontFamily: F_DISP, fontSize: 14, color: FPL.accent,
        fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.01em',
      }}>Change</button>
    </div>
  );
}

function GwArrow({ dir, enabled }) {
  return (
    <button style={{
      width: 36, height: 36, borderRadius: 999,
      background: enabled ? 'rgba(0,255,135,0.12)' : 'rgba(255,255,255,0.05)',
      border: enabled ? `1px solid ${FPL.accent}` : `1px solid ${FPL.bgHair}`,
      display: 'grid', placeItems: 'center',
      cursor: enabled ? 'pointer' : 'not-allowed', opacity: enabled ? 1 : 0.45,
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
        style={{ transform: dir === 'right' ? 'rotate(180deg)' : 'none' }}>
        <path d="M10 4l-4 4 4 4" stroke={enabled ? FPL.accent : FPL.mutedSoft}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function GwControlV2({ gw, atLatest = true, loading = false }) {
  return (
    <div style={{
      padding: '4px 16px 8px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
    }}>
      <GwArrow dir="left" enabled={true}/>
      {loading ? (
        <div style={{
          width: 130, height: 20, borderRadius: 4,
          background: 'rgba(255,255,255,0.10)',
          animation: 'fplShimmer 1.6s ease-in-out infinite',
          backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 100%)',
          backgroundSize: '200% 100%',
        }}/>
      ) : (
        <span style={{
          fontFamily: F_DISP, fontSize: 17, fontWeight: 700,
          color: FPL.text, letterSpacing: '-0.01em',
        }}>Gameweek {gw}</span>
      )}
      <GwArrow dir="right" enabled={!atLatest}/>
    </div>
  );
}

// ─── Gameweek summary strip ───────────────────────────────────────────
function SummaryStrip({ summary, loading = false }) {
  const dash = '\u2014';
  const val = (v) => (v === null || v === undefined ? dash : v);
  const cells = [
    { label: 'AVG',       value: summary?.average },
    { label: 'HIGHEST',   value: summary?.highest },
    { label: 'TOTAL',     value: summary?.total, big: true },
    { label: 'RANK',      value: summary?.rank },
    { label: 'TRANSFERS', value: summary?.transfers },
  ];
  return (
    <div style={{
      margin: '0 16px 10px',
      background: 'rgba(0,0,0,0.32)',
      border: `1px solid ${FPL.bgHair}`,
      borderRadius: 12,
      padding: '10px 4px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1.25fr 1fr 1fr',
      alignItems: 'center',
    }}>
      {cells.map((c, i) => (
        <div key={c.label} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 2, borderLeft: i > 0 ? `1px solid ${FPL.bgHair}` : 'none',
          padding: '0 4px', minWidth: 0,
        }}>
          <span style={{
            fontFamily: F_DISP, fontSize: 9.5, fontWeight: 700,
            color: c.big ? FPL.accent : FPL.muted,
            letterSpacing: '0.10em', textTransform: 'uppercase',
          }}>{c.label}</span>
          {loading ? (
            <div style={{
              width: c.big ? 48 : 32, height: c.big ? 24 : 18, borderRadius: 4,
              marginTop: 2,
              background: 'rgba(255,255,255,0.10)',
              animation: 'fplShimmer 1.6s ease-in-out infinite',
              backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 100%)',
              backgroundSize: '200% 100%',
            }}/>
          ) : (
            <span style={{
              fontFamily: F_DISP,
              fontSize: c.big ? 22 : 15, fontWeight: c.big ? 800 : 700,
              color: c.big ? FPL.accent : FPL.text,
              letterSpacing: c.big ? '-0.02em' : '-0.01em',
              fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
              whiteSpace: 'nowrap',
            }}>{val(c.value)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── SQUAD SCREEN V2 (pitch layout) ─────────────────────────────────
function SquadScreenV2({ state = 'loaded' }) {
  if (state === 'loading') return <SquadScreenV2Loading/>;
  if (state === 'empty')   return <SquadScreenV2Empty/>;
  return <SquadScreenV2Loaded/>;
}

function SquadScreenV2Loaded() {
  return (
    <V2Frame>
      <StatusBarV2/>
      <SquadHeaderV2 teamName="Arteta's Army"/>
      <GwControlV2 gw={37} atLatest={true}/>
      <SummaryStrip summary={V2_SUMMARY}/>
      <div style={{ flex: 1, padding: '0 16px', minHeight: 0 }}>
        <Pitch starters={V2_STARTERS} width={358} height={420}/>
        <BenchStrip bench={V2_BENCH}/>
      </div>
      <HomeIndicatorV2/>
    </V2Frame>
  );
}

function SquadScreenV2Loading() {
  return (
    <V2Frame>
      <StatusBarV2/>
      <SquadHeaderV2 loading/>
      <GwControlV2 gw={37} loading/>
      <SummaryStrip loading/>
      <div style={{ flex: 1, padding: '0 16px', minHeight: 0 }}>
        <PitchSkeleton width={358} height={420}/>
        {/* bench skeleton */}
        <div style={{
          margin: '12px 0 0', background: 'rgba(0,0,0,0.28)',
          border: `1px solid ${FPL.bgHair}`, borderRadius: 10,
          padding: '12px 8px 14px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                height: 12, margin: '0 18px', borderRadius: 3,
                background: 'rgba(255,255,255,0.10)',
              }}/>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                <PitchPlayerSkeleton jerseySize={48}/>
              </div>
            ))}
          </div>
        </div>
      </div>
      <HomeIndicatorV2/>
    </V2Frame>
  );
}

function SquadScreenV2Empty() {
  return (
    <V2Frame>
      <StatusBarV2/>
      <SquadHeaderV2 teamName="Arteta's Army"/>
      <GwControlV2 gw={1} atLatest={false}/>
      <SummaryStrip summary={{
        total: null, average: 51, highest: 88, rank: null, transfers: null,
      }}/>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 32px 24px', textAlign: 'center',
      }}>
        {/* empty pitch illustration */}
        <div style={{
          width: 200, height: 200, borderRadius: 16, position: 'relative',
          overflow: 'hidden', marginBottom: 28,
          border: `1px solid ${FPL.bgHair}`,
        }}>
          <PitchBg width={200} height={200}/>
          <div style={{
            position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 999,
              background: 'rgba(23,0,39,0.85)',
              border: `2px solid ${FPL.accent}`,
              display: 'grid', placeItems: 'center',
              color: FPL.accent, fontFamily: F_DISP, fontSize: 32, fontWeight: 700,
            }}>?</div>
          </div>
        </div>
        <h3 style={{
          margin: 0, fontFamily: F_DISP, fontSize: 22, fontWeight: 700,
          color: FPL.text, letterSpacing: '-0.02em',
        }}>No squad yet</h3>
        <p style={{
          margin: '8px 0 0', fontFamily: F_DISP, fontSize: 14,
          color: FPL.muted, lineHeight: 1.5, maxWidth: 280,
        }}>
          No squad available for Gameweek&nbsp;1. Use the arrows to jump to a later gameweek.
        </p>
        <button style={{
          marginTop: 24, height: 44, padding: '0 20px', borderRadius: 999,
          background: FPL.accent, color: FPL.bgDeep, border: 'none',
          fontFamily: F_DISP, fontSize: 14, fontWeight: 700,
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
          whiteSpace: 'nowrap',
        }}>
          Jump to current GW
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8m-3-3l3 3-3 3" stroke={FPL.bgDeep} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <HomeIndicatorV2/>
    </V2Frame>
  );
}

Object.assign(window, {
  EntryScreenV2, SquadScreenV2,
  V2_STARTERS, V2_BENCH,
});
