// screens.jsx — FPL Squad Viewer
// EntryScreen (states: idle | invalid | notFound)
// SquadScreen (states: loading | loaded | empty)

// ─── tokens ──────────────────────────────────────────────────────────
const T = {
  green:      'oklch(0.72 0.20 152)',
  greenDeep:  'oklch(0.58 0.20 152)',
  greenInk:   'oklch(0.30 0.12 152)',
  greenSoft:  'oklch(0.96 0.06 152)',
  bg:         '#FAFAF7',
  card:       '#FFFFFF',
  ink:        '#0E1112',
  inkSoft:    '#23292B',
  muted:      '#6A7174',
  mutedSoft:  '#9AA0A3',
  hairline:   '#E6E8EA',
  hairlineSoft:'#EFF1F2',
  error:      'oklch(0.58 0.21 25)',
  errorBg:    'oklch(0.97 0.04 25)',
  // position pills
  GK:  { bg: 'oklch(0.96 0.07 80)',  fg: 'oklch(0.42 0.13 70)'  },
  DEF: { bg: 'oklch(0.95 0.05 245)', fg: 'oklch(0.40 0.15 252)' },
  MID: { bg: 'oklch(0.95 0.05 305)', fg: 'oklch(0.42 0.16 305)' },
  FWD: { bg: 'oklch(0.95 0.05 25)',  fg: 'oklch(0.48 0.19 25)'  },
};

const FONT_DISPLAY = '"Space Grotesk", -apple-system, system-ui, sans-serif';
const FONT_MONO    = '"JetBrains Mono", ui-monospace, "SF Mono", monospace';

// ─── data ────────────────────────────────────────────────────────────
const STARTERS = [
  { pos: 'GK',  name: 'Raya',       club: 'ARS', pts: 6  },
  { pos: 'DEF', name: 'White',      club: 'ARS', pts: 4  },
  { pos: 'DEF', name: 'Saliba',     club: 'ARS', pts: 8  },
  { pos: 'DEF', name: 'Gabriel',    club: 'ARS', pts: 9  },
  { pos: 'DEF', name: 'Mykolenko',  club: 'EVE', pts: 2  },
  { pos: 'MID', name: 'Saka',       club: 'ARS', pts: 14, cap: 'C' },
  { pos: 'MID', name: 'Ødegaard',   club: 'ARS', pts: 7,  cap: 'V' },
  { pos: 'MID', name: 'Rodri',      club: 'MCI', pts: 10 },
  { pos: 'MID', name: 'Martinelli', club: 'ARS', pts: 5  },
  { pos: 'FWD', name: 'Watkins',    club: 'AVL', pts: 11 },
  { pos: 'FWD', name: 'Isak',       club: 'NEW', pts: 15 },
];
const BENCH = [
  { pos: 'GK',  name: 'Flekken',     club: 'BRE', pts: 3 },
  { pos: 'DEF', name: 'Trippier',    club: 'NEW', pts: 4 },
  { pos: 'DEF', name: 'Pedro Porro', club: 'TOT', pts: 6 },
  { pos: 'MID', name: 'Mbeumo',      club: 'BRE', pts: 5 },
];
const TOTAL_PTS = STARTERS.reduce((s,p) => s + (p.cap === 'C' ? p.pts*2 : p.pts), 0);

// ─── shared chrome ───────────────────────────────────────────────────
function StatusBar({ dark = false }) {
  const c = dark ? '#fff' : '#0E1112';
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

function HomeIndicator() {
  return (
    <div style={{
      height: 34, display: 'flex', alignItems: 'flex-end',
      justifyContent: 'center', paddingBottom: 8, flexShrink: 0,
    }}>
      <div style={{ width: 134, height: 5, borderRadius: 3, background: '#0E1112' }}/>
    </div>
  );
}

// Frame: 390x844, white phone screen
function Frame({ children, bg = T.bg }) {
  return (
    <div style={{
      width: 390, height: 844, background: bg, color: T.ink,
      fontFamily: FONT_DISPLAY, position: 'relative',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

// ─── small atoms ─────────────────────────────────────────────────────
function Logo({ size = 36 }) {
  // Abstract pitch-square mark — original, no real PL logo
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, background: T.ink,
      display: 'grid', placeItems: 'center', position: 'relative',
    }}>
      <svg width={size*0.55} height={size*0.55} viewBox="0 0 20 20" fill="none">
        <rect x="1.5" y="1.5" width="17" height="17" rx="2" stroke={T.green} strokeWidth="1.6"/>
        <line x1="10" y1="1.5" x2="10" y2="18.5" stroke={T.green} strokeWidth="1.2"/>
        <circle cx="10" cy="10" r="2.6" stroke={T.green} strokeWidth="1.2" fill="none"/>
        <path d="M1.5 6 H4.5 V14 H1.5" stroke={T.green} strokeWidth="1.2" fill="none"/>
        <path d="M18.5 6 H15.5 V14 H18.5" stroke={T.green} strokeWidth="1.2" fill="none"/>
      </svg>
    </div>
  );
}

function PosPill({ pos, dim = false }) {
  const c = T[pos] || T.MID;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 42, height: 22, borderRadius: 6,
      background: c.bg, color: c.fg, opacity: dim ? 0.55 : 1,
      fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 700,
      letterSpacing: '0.04em',
    }}>{pos}</span>
  );
}

function CapBadge({ kind }) {
  const isCap = kind === 'C';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 20, height: 20, borderRadius: 999,
      background: isCap ? T.ink : 'transparent',
      border: isCap ? 'none' : `1.5px solid ${T.ink}`,
      color: isCap ? '#fff' : T.ink,
      fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 700,
      letterSpacing: '-0.02em', lineHeight: 1,
    }}>{kind}</span>
  );
}

function Skeleton({ w = '100%', h = 14, r = 6, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, #ECEEF0 0%, #F4F6F8 50%, #ECEEF0 100%)',
      backgroundSize: '200% 100%', animation: 'fplShimmer 1.6s ease-in-out infinite',
      ...style,
    }}/>
  );
}

// ─── Player row ──────────────────────────────────────────────────────
function PlayerRow({ player, dim = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 20px', background: T.card,
      opacity: dim ? 0.62 : 1,
    }}>
      <PosPill pos={player.pos} dim={dim} />
      <div style={{
        flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 16,
          color: T.ink, letterSpacing: '-0.01em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{player.name}</span>
        {player.cap && <CapBadge kind={player.cap} />}
      </div>
      <span style={{
        fontFamily: FONT_MONO, fontSize: 11, color: T.mutedSoft,
        fontWeight: 500, letterSpacing: '0.04em',
      }}>{player.club}</span>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 3,
        minWidth: 58, justifyContent: 'flex-end',
      }}>
        <span style={{
          fontFamily: FONT_DISPLAY, fontVariantNumeric: 'tabular-nums',
          fontWeight: 700, fontSize: 17, color: T.ink, letterSpacing: '-0.02em',
        }}>{player.pts}</span>
        <span style={{
          fontFamily: FONT_DISPLAY, fontSize: 11, color: T.muted,
          fontWeight: 500,
        }}>pts</span>
      </div>
    </div>
  );
}

function PlayerRowSkeleton({ dim = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 20px', background: T.card, opacity: dim ? 0.5 : 1,
    }}>
      <Skeleton w={42} h={22} r={6}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Skeleton w={96} h={14} r={5}/>
      </div>
      <Skeleton w={28} h={10} r={4}/>
      <Skeleton w={44} h={16} r={5}/>
    </div>
  );
}

function SectionLabel({ children, count }) {
  return (
    <div style={{
      padding: '18px 20px 8px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span style={{
        fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 700,
        color: T.muted, letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>{children}</span>
      {count != null && (
        <span style={{
          fontFamily: FONT_MONO, fontSize: 11, color: T.mutedSoft, fontWeight: 500,
        }}>{count}</span>
      )}
    </div>
  );
}

// ─── ENTRY SCREEN ────────────────────────────────────────────────────
function EntryScreen({ state = 'idle' }) {
  const isInvalid = state === 'invalid';
  const isNotFound = state === 'notFound';
  const value = isInvalid ? '12abc34' : isNotFound ? '9999999' : '';
  const buttonEnabled = isNotFound; // re-enabled in not-found state
  const showError = isInvalid || isNotFound;
  const errorMsg = isInvalid
    ? 'Please enter a valid team ID (numbers only).'
    : "We couldn't find a team with that ID. Please check and try again.";

  return (
    <Frame bg={T.bg}>
      <StatusBar />

      {/* hero */}
      <div style={{
        flex: 1, padding: '24px 24px 0', display: 'flex',
        flexDirection: 'column',
      }}>
        {/* brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <Logo size={32}/>
          <span style={{
            fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 600,
            color: T.muted, letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>FPL Squad Viewer</span>
        </div>

        {/* title block */}
        <div style={{ marginTop: 56 }}>
          <h1 style={{
            margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 700,
            fontSize: 38, lineHeight: 1.05, letterSpacing: '-0.035em',
            color: T.ink,
          }}>
            See your squad,<br/>
            <span style={{ color: T.green }}>game by game.</span>
          </h1>
          <p style={{
            margin: '14px 0 0', fontFamily: FONT_DISPLAY, fontSize: 15,
            color: T.muted, lineHeight: 1.5, fontWeight: 400,
            maxWidth: 320,
          }}>
            See your FPL squad and points — just enter your team ID. No login, no fuss.
          </p>
        </div>

        {/* input block */}
        <div style={{ marginTop: 44 }}>
          <label style={{
            display: 'block', fontFamily: FONT_DISPLAY, fontSize: 12,
            fontWeight: 600, color: T.inkSoft, letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: 8,
          }}>Team ID</label>

          <div style={{
            display: 'flex', alignItems: 'center',
            height: 56, borderRadius: 14, background: T.card,
            border: `1.5px solid ${showError ? T.error : T.hairline}`,
            padding: '0 18px',
            boxShadow: showError ? `0 0 0 3px ${T.errorBg}` : 'none',
            transition: 'all .15s',
          }}>
            {value ? (
              <span style={{
                fontFamily: FONT_MONO, fontSize: 18,
                color: isInvalid ? T.error : T.ink,
                letterSpacing: '0.01em', fontVariantNumeric: 'tabular-nums',
              }}>{value}<span style={{
                display: 'inline-block', width: 1.5, height: 20,
                background: T.ink, marginLeft: 2,
                verticalAlign: 'middle', opacity: 0.7,
              }}/></span>
            ) : (
              <span style={{
                fontFamily: FONT_MONO, fontSize: 18, color: T.mutedSoft,
                letterSpacing: '0.01em',
              }}>e.g. 1234567</span>
            )}
          </div>

          {/* helper / error */}
          <div style={{ marginTop: 10, minHeight: 36 }}>
            {showError ? (
              <div style={{
                display: 'flex', gap: 6, alignItems: 'flex-start',
                fontFamily: FONT_DISPLAY, fontSize: 13, color: T.error,
                fontWeight: 500, lineHeight: 1.45,
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0, marginTop: 2 }}>
                  <circle cx="7" cy="7" r="6.3" fill={T.error}/>
                  <path d="M7 3.5v4M7 9.5v.1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                <span>{errorMsg}</span>
              </div>
            ) : (
              <p style={{
                margin: 0, fontFamily: FONT_DISPLAY, fontSize: 13,
                color: T.muted, lineHeight: 1.45,
              }}>
                Find your ID in the FPL URL:<br/>
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: T.inkSoft }}>
                  fantasy.premierleague.com/entry/<span style={{ color: T.green }}>{'{ID}'}</span>/event/<span style={{ color: T.green }}>{'{GW}'}</span>
                </span>
              </p>
            )}
          </div>
        </div>

        {/* button */}
        <button style={{
          marginTop: 24, height: 56, borderRadius: 14, border: 'none',
          background: buttonEnabled ? T.ink : T.hairlineSoft,
          color: buttonEnabled ? '#fff' : T.mutedSoft,
          fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600,
          letterSpacing: '-0.01em', cursor: buttonEnabled ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, transition: 'all .15s',
        }}>
          View squad
          {buttonEnabled && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8m-3-3l3 3-3 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        <div style={{ flex: 1 }}/>

        {/* footer micro-copy */}
        <p style={{
          textAlign: 'center', fontFamily: FONT_DISPLAY, fontSize: 11,
          color: T.mutedSoft, marginBottom: 14, fontWeight: 500,
          letterSpacing: '0.02em',
        }}>
          Unofficial fan-made viewer · v0.3
        </p>
      </div>

      <HomeIndicator/>
    </Frame>
  );
}

// ─── SQUAD SCREEN ────────────────────────────────────────────────────
function SquadHeader({ teamName, loading = false }) {
  return (
    <div style={{
      padding: '12px 20px 14px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
      borderBottom: `1px solid ${T.hairlineSoft}`,
      background: T.card,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Logo size={28}/>
        {loading ? (
          <Skeleton w={130} h={18} r={6}/>
        ) : (
          <div>
            <div style={{
              fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700,
              color: T.ink, letterSpacing: '-0.015em', lineHeight: 1.15,
            }}>{teamName}</div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10.5, color: T.mutedSoft,
              fontWeight: 500, letterSpacing: '0.04em', marginTop: 1,
            }}>ID · 1234567</div>
          </div>
        )}
      </div>
      <button style={{
        background: 'transparent', border: 'none', padding: '6px 4px',
        fontFamily: FONT_DISPLAY, fontSize: 14, color: T.green,
        fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em',
      }}>Change</button>
    </div>
  );
}

function GwControl({ gw, atLatest = true, loading = false, hideTotals = false }) {
  const prevEnabled = true;
  const nextEnabled = !atLatest;
  return (
    <div style={{
      padding: '14px 16px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
      background: T.card, borderBottom: `1px solid ${T.hairlineSoft}`,
    }}>
      <ArrowButton dir="left"  enabled={prevEnabled}/>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        {loading ? (
          <Skeleton w={110} h={18} r={6}/>
        ) : (
          <span style={{
            fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700,
            color: T.ink, letterSpacing: '-0.01em',
          }}>Gameweek {gw}</span>
        )}
        {!loading && !hideTotals && (
          <span style={{
            fontFamily: FONT_MONO, fontSize: 10.5, color: T.muted,
            fontWeight: 500, letterSpacing: '0.05em',
          }}>
            <span style={{ color: T.greenDeep, fontWeight: 700 }}>{TOTAL_PTS}</span> total pts
          </span>
        )}
      </div>
      <ArrowButton dir="right" enabled={nextEnabled}/>
    </div>
  );
}

function ArrowButton({ dir, enabled }) {
  return (
    <button style={{
      width: 38, height: 38, borderRadius: 10,
      background: enabled ? T.greenSoft : 'transparent',
      border: enabled ? 'none' : `1px solid ${T.hairline}`,
      display: 'grid', placeItems: 'center', cursor: enabled ? 'pointer' : 'not-allowed',
      opacity: enabled ? 1 : 0.5,
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
        style={{ transform: dir === 'right' ? 'rotate(180deg)' : 'none' }}>
        <path d="M10 4l-4 4 4 4" stroke={enabled ? T.greenDeep : T.mutedSoft}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function SquadScreen({ state = 'loaded' }) {
  if (state === 'loading') return <SquadScreenLoading/>;
  if (state === 'empty')   return <SquadScreenEmpty/>;
  return <SquadScreenLoaded/>;
}

function SquadScreenLoaded() {
  return (
    <Frame bg={T.bg}>
      <StatusBar/>
      <SquadHeader teamName="Arteta's Army"/>
      <GwControl gw={37} atLatest={true}/>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <SectionLabel count="11">Starting XI</SectionLabel>
        <div style={{ background: T.card }}>
          {STARTERS.map((p, i) => (
            <div key={i} style={{
              borderBottom: i < STARTERS.length - 1 ? `1px solid ${T.hairlineSoft}` : 'none',
            }}>
              <PlayerRow player={p}/>
            </div>
          ))}
        </div>

        <SectionLabel count="4">Bench</SectionLabel>
        <div style={{ background: T.card }}>
          {BENCH.map((p, i) => (
            <div key={i} style={{
              borderBottom: i < BENCH.length - 1 ? `1px solid ${T.hairlineSoft}` : 'none',
            }}>
              <PlayerRow player={p} dim/>
            </div>
          ))}
        </div>
      </div>

      <HomeIndicator/>
    </Frame>
  );
}

function SquadScreenLoading() {
  return (
    <Frame bg={T.bg}>
      <StatusBar/>
      <SquadHeader teamName="" loading/>
      <GwControl gw={37} loading/>

      <div style={{ flex: 1 }}>
        <SectionLabel>Starting XI</SectionLabel>
        <div style={{ background: T.card }}>
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} style={{
              borderBottom: i < 10 ? `1px solid ${T.hairlineSoft}` : 'none',
            }}>
              <PlayerRowSkeleton/>
            </div>
          ))}
        </div>
        <SectionLabel>Bench</SectionLabel>
        <div style={{ background: T.card }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              borderBottom: i < 3 ? `1px solid ${T.hairlineSoft}` : 'none',
            }}>
              <PlayerRowSkeleton dim/>
            </div>
          ))}
        </div>
      </div>
      <HomeIndicator/>
    </Frame>
  );
}

function SquadScreenEmpty() {
  return (
    <Frame bg={T.bg}>
      <StatusBar/>
      <SquadHeader teamName="Arteta's Army"/>
      <GwControl gw={1} atLatest={false} hideTotals/>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 36px', textAlign: 'center',
      }}>
        {/* empty illustration: stylized pitch with a dashed circle */}
        <div style={{
          width: 140, height: 140, borderRadius: 24,
          background: T.greenSoft, position: 'relative',
          display: 'grid', placeItems: 'center', marginBottom: 28,
        }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect x="6" y="10" width="68" height="60" rx="4"
              stroke={T.green} strokeWidth="2" fill="none"/>
            <line x1="40" y1="10" x2="40" y2="70" stroke={T.green} strokeWidth="1.4" strokeDasharray="3 3"/>
            <circle cx="40" cy="40" r="9" stroke={T.green} strokeWidth="1.6" fill="none" strokeDasharray="3 3"/>
            <path d="M6 24 H18 V56 H6" stroke={T.green} strokeWidth="1.4" fill="none"/>
            <path d="M74 24 H62 V56 H74" stroke={T.green} strokeWidth="1.4" fill="none"/>
            <circle cx="40" cy="40" r="2" fill={T.greenDeep}/>
          </svg>
          <span style={{
            position: 'absolute', top: -8, right: -8,
            width: 32, height: 32, borderRadius: 999, background: T.ink,
            color: T.greenSoft, display: 'grid', placeItems: 'center',
            fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700,
          }}>?</span>
        </div>
        <h3 style={{
          margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700,
          color: T.ink, letterSpacing: '-0.02em',
        }}>No squad yet</h3>
        <p style={{
          margin: '8px 0 0', fontFamily: FONT_DISPLAY, fontSize: 14,
          color: T.muted, lineHeight: 1.5, maxWidth: 280,
        }}>
          No squad available for Gameweek&nbsp;1. Use the arrows to jump to a later gameweek.
        </p>
        <button style={{
          marginTop: 24, height: 44, padding: '0 20px', borderRadius: 12,
          background: T.ink, color: '#fff', border: 'none',
          fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          Jump to current GW
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8m-3-3l3 3-3 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <HomeIndicator/>
    </Frame>
  );
}

// expose for index.html
Object.assign(window, {
  EntryScreen, SquadScreen,
  STARTERS, BENCH, T,
});
