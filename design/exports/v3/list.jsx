// list.jsx — ViewToggle + ListView (Squad / List mode)
// Implements the list view described in design-994f6b45.md:
// grouped by GK · DEF · MID · FWD · Bench; sticky identity column
// on the left; remaining stat columns scroll horizontally.

// ─── Segmented Pitch / List toggle ──────────────────────────────────
function ViewToggle({ value = 'pitch' }) {
  const opts = [
    { id: 'pitch', label: 'Pitch' },
    { id: 'list',  label: 'List'  },
  ];
  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      padding: '0 16px 8px',
    }}>
      <div style={{
        display: 'inline-flex',
        background: 'rgba(0,0,0,0.32)',
        border: `1px solid ${FPL.bgHair}`,
        borderRadius: 999, padding: 3,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}>
        {opts.map(o => {
          const sel = o.id === value;
          return (
            <button key={o.id} style={{
              padding: '7px 22px', borderRadius: 999, border: 'none',
              background: sel ? FPL.accent : 'transparent',
              color: sel ? FPL.bgDeep : FPL.textSoft,
              fontFamily: F_DISP, fontWeight: 700, fontSize: 12.5,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: 'pointer', minWidth: 76,
              transition: 'background .15s, color .15s',
              boxShadow: sel ? '0 2px 6px rgba(0,0,0,0.35)' : 'none',
            }}>{o.label}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Small badges used inside list rows ─────────────────────────────
function PositionBadge({ pos }) {
  const c = ({
    GK:  { bg: '#FFE600', fg: '#241500' },
    DEF: { bg: '#3DB1FF', fg: '#001F2E' },
    MID: { bg: FPL.accent, fg: FPL.bgDeep },
    FWD: { bg: '#FF4D6D', fg: '#FFFFFF' },
  })[pos] || { bg: FPL.bgHair, fg: FPL.textSoft };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 5px', borderRadius: 4,
      fontFamily: F_DISP, fontSize: 9, fontWeight: 800,
      letterSpacing: '0.06em',
      background: c.bg, color: c.fg, lineHeight: 1,
    }}>{pos}</span>
  );
}

function CapInlineBadge({ cap }) {
  if (!cap) return null;
  const isC = cap === 'C';
  return (
    <span style={{
      width: 16, height: 16, borderRadius: 999,
      background: isC ? FPL.accent : '#FFFFFF',
      color: FPL.bgDeep,
      fontFamily: F_DISP, fontWeight: 800, fontSize: 9,
      display: 'inline-grid', placeItems: 'center',
      letterSpacing: '-0.02em', lineHeight: 1, flexShrink: 0,
    }}>{cap}</span>
  );
}

// Tiny inline availability dot — matches the on-kit AvailBadge palette
function StatusDot({ status }) {
  const c = ({
    d: '#FFC000',
    i: '#FF4D6D',
    s: '#FF4D6D',
    u: '#FF4D6D',
  })[status] || '#FFC000';
  return (
    <span style={{
      width: 8, height: 8, borderRadius: 999,
      background: c, flexShrink: 0,
      boxShadow: '0 0 0 1.5px #220035',
    }}/>
  );
}

// ─── List view ──────────────────────────────────────────────────────
// Column definitions. Pts is highlighted; the rest are mono numerals.
const LIST_COLS = [
  { key: 'total_points',     label: 'Pts',  width: 44, hi: true },
  { key: 'minutes',          label: 'MP',   width: 38 },
  { key: 'goals_scored',     label: 'GS',   width: 38 },
  { key: 'assists',          label: 'A',    width: 36 },
  { key: 'clean_sheets',     label: 'CS',   width: 38 },
  { key: 'goals_conceded',   label: 'GC',   width: 38 },
  { key: 'own_goals',        label: 'OG',   width: 38 },
  { key: 'penalties_saved',  label: 'PS',   width: 38 },
  { key: 'penalties_missed', label: 'PM',   width: 38 },
  { key: 'yellow_cards',     label: 'YC',   width: 38 },
  { key: 'red_cards',        label: 'RC',   width: 38 },
  { key: 'saves',            label: 'S',    width: 36 },
  { key: 'bonus',            label: 'Bon',  width: 42 },
];

const IDENTITY_W = 168;

function listGridTemplate() {
  return `${IDENTITY_W}px ` + LIST_COLS.map(c => `${c.width}px`).join(' ');
}

function ListColumnHeader() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: listGridTemplate(),
      position: 'sticky', top: 0, zIndex: 3,
      background: FPL.bgDeep,
      borderBottom: `1px solid ${FPL.bgHair}`,
      height: 30,
    }}>
      {/* identity header — sticky-left */}
      <div style={{
        position: 'sticky', left: 0, zIndex: 2,
        background: FPL.bgDeep,
        padding: '0 12px',
        display: 'flex', alignItems: 'center',
        fontFamily: F_DISP, fontSize: 9.5, fontWeight: 700,
        color: FPL.mutedSoft, letterSpacing: '0.12em',
        textTransform: 'uppercase',
        borderRight: `1px solid ${FPL.bgHair}`,
        boxShadow: '8px 0 14px -10px rgba(0,0,0,0.75)',
      }}>Player</div>
      {LIST_COLS.map(c => (
        <div key={c.key} style={{
          padding: '0 4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: F_DISP, fontSize: 9.5, fontWeight: 700,
          color: c.hi ? FPL.accent : FPL.mutedSoft,
          letterSpacing: '0.10em', textTransform: 'uppercase',
        }}>{c.label}</div>
      ))}
    </div>
  );
}

function SectionHeader({ title, count }) {
  return (
    <div style={{
      // wrapper spans full inner width so the divider can run across
      position: 'relative', height: 32,
      borderBottom: `1px solid rgba(255,255,255,0.04)`,
    }}>
      <div style={{
        position: 'sticky', left: 0, height: '100%',
        width: 'fit-content', display: 'flex', alignItems: 'center',
        padding: '0 14px', gap: 8,
      }}>
        <span style={{
          fontFamily: F_DISP, fontSize: 10.5, fontWeight: 800,
          color: FPL.textSoft, letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>{title}</span>
        <span style={{
          fontFamily: F_MONO, fontSize: 10, color: FPL.mutedSoft,
          fontVariantNumeric: 'tabular-nums', fontWeight: 500,
        }}>{count}</span>
      </div>
    </div>
  );
}

function ListRow({ p, last }) {
  const isGK = p.pos === 'GK';
  const stats = p.stats || {};
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: listGridTemplate(),
      borderBottom: last ? 'none' : `1px solid rgba(255,255,255,0.05)`,
      minHeight: 56,
    }}>
      {/* sticky identity column */}
      <div style={{
        position: 'sticky', left: 0, zIndex: 1,
        background: FPL.bg,
        padding: '8px 10px 8px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderRight: `1px solid ${FPL.bgHair}`,
        boxShadow: '8px 0 14px -10px rgba(0,0,0,0.75)',
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Jersey club={p.club} isGK={isGK} size={36}/>
          {p.status && (
            <span style={{
              position: 'absolute', top: -2, right: -3,
            }}>
              <StatusDot status={p.status}/>
            </span>
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontFamily: F_DISP, fontWeight: 700, fontSize: 13.5,
            color: FPL.text, letterSpacing: '-0.01em', lineHeight: 1.15,
          }}>
            <span style={{
              overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', minWidth: 0,
            }}>{p.name}</span>
            {p.cap && <CapInlineBadge cap={p.cap}/>}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
            fontFamily: F_MONO, fontSize: 10, color: FPL.mutedSoft,
            letterSpacing: '0.04em', fontWeight: 500,
          }}>
            <PositionBadge pos={p.pos}/>
            <span>{p.club}</span>
          </div>
        </div>
      </div>
      {/* stat cells */}
      {LIST_COLS.map(c => {
        const v = stats[c.key];
        const display = (v === null || v === undefined) ? '\u2014' : v;
        const isZero = v === 0;
        return (
          <div key={c.key} style={{
            padding: '6px 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: F_DISP, fontVariantNumeric: 'tabular-nums',
            fontSize: c.hi ? 15 : 13.5,
            fontWeight: c.hi ? 800 : 500,
            color: c.hi
              ? FPL.accent
              : (isZero ? FPL.mutedSoft : FPL.textSoft),
            letterSpacing: '-0.01em',
          }}>{display}</div>
        );
      })}
    </div>
  );
}

function ListView({ starters, bench, initialScroll = 0 }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && initialScroll) ref.current.scrollLeft = initialScroll;
  }, [initialScroll]);
  const gk  = starters.filter(p => p.pos === 'GK');
  const def = starters.filter(p => p.pos === 'DEF');
  const mid = starters.filter(p => p.pos === 'MID');
  const fwd = starters.filter(p => p.pos === 'FWD');
  const sections = [
    { id: 'gk',    title: 'Goalkeeper',  players: gk    },
    { id: 'def',   title: 'Defenders',   players: def   },
    { id: 'mid',   title: 'Midfielders', players: mid   },
    { id: 'fwd',   title: 'Forwards',    players: fwd   },
    { id: 'bench', title: 'Bench',       players: bench },
  ];
  // total inner width — sum of all columns
  const innerW = IDENTITY_W + LIST_COLS.reduce((s, c) => s + c.width, 0);
  return (
    <div ref={ref} style={{
      position: 'relative', height: '100%',
      background: FPL.bg,
      borderTop: `1px solid ${FPL.bgHair}`,
      overflow: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      <div style={{ minWidth: innerW }}>
        <ListColumnHeader/>
        {sections.map(s => (
          <React.Fragment key={s.id}>
            <SectionHeader title={s.title} count={s.players.length}/>
            {s.players.map((p, i) => (
              <ListRow key={`${s.id}-${i}`} p={p}
                last={i === s.players.length - 1}/>
            ))}
          </React.Fragment>
        ))}
        {/* trailing space so last row never sits flush against home indicator */}
        <div style={{ height: 12 }}/>
      </div>
    </div>
  );
}

// ─── Skeleton row for list-loading state ─────────────────────────────
function ListRowSkeleton() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: listGridTemplate(),
      minHeight: 56,
      borderBottom: `1px solid rgba(255,255,255,0.05)`,
    }}>
      <div style={{
        position: 'sticky', left: 0, zIndex: 1,
        background: FPL.bg,
        padding: '10px 10px 10px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderRight: `1px solid ${FPL.bgHair}`,
        boxShadow: '8px 0 14px -10px rgba(0,0,0,0.75)',
      }}>
        <div style={{
          width: 30, height: 36, borderRadius: 4,
          background: 'rgba(255,255,255,0.08)',
          animation: 'fplShimmer 1.6s ease-in-out infinite',
          backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.06) 100%)',
          backgroundSize: '200% 100%',
        }}/>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            width: '70%', height: 11, borderRadius: 3,
            background: 'rgba(255,255,255,0.10)',
            animation: 'fplShimmer 1.6s ease-in-out infinite',
            backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 100%)',
            backgroundSize: '200% 100%',
          }}/>
          <div style={{
            width: '45%', height: 9, borderRadius: 3,
            background: 'rgba(255,255,255,0.07)',
            animation: 'fplShimmer 1.6s ease-in-out infinite',
            backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.06) 100%)',
            backgroundSize: '200% 100%',
          }}/>
        </div>
      </div>
      {LIST_COLS.map(c => (
        <div key={c.key} style={{
          padding: '0 6px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: Math.max(18, c.width - 18), height: 10, borderRadius: 3,
            background: 'rgba(255,255,255,0.08)',
            animation: 'fplShimmer 1.6s ease-in-out infinite',
            backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0.06) 100%)',
            backgroundSize: '200% 100%',
          }}/>
        </div>
      ))}
    </div>
  );
}

function ListViewSkeleton({ rowCount = 8 }) {
  const innerW = IDENTITY_W + LIST_COLS.reduce((s, c) => s + c.width, 0);
  return (
    <div style={{
      position: 'relative', height: '100%',
      background: FPL.bg,
      borderTop: `1px solid ${FPL.bgHair}`,
      overflow: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      <div style={{ minWidth: innerW }}>
        <ListColumnHeader/>
        {Array.from({ length: rowCount }).map((_, i) => (
          <ListRowSkeleton key={i}/>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  ViewToggle, ListView, ListViewSkeleton,
  PositionBadge, CapInlineBadge, StatusDot,
});
