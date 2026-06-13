export function IconChips({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="6" y="6" width="16" height="16" rx="2" stroke="#f97316" strokeWidth="1.5" />
      <line x1="10" y1="6" x2="10" y2="22" stroke="#f97316" strokeWidth="1" opacity="0.5" />
      <line x1="18" y1="6" x2="18" y2="22" stroke="#f97316" strokeWidth="1" opacity="0.5" />
      <line x1="6" y1="10" x2="22" y2="10" stroke="#f97316" strokeWidth="1" opacity="0.5" />
      <line x1="6" y1="18" x2="22" y2="18" stroke="#f97316" strokeWidth="1" opacity="0.5" />
      <line x1="3" y1="10" x2="6" y2="10" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="14" x2="6" y2="14" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="18" x2="6" y2="18" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="10" x2="25" y2="10" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="14" x2="25" y2="14" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="18" x2="25" y2="18" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="3" x2="10" y2="6" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="3" x2="18" y2="6" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="22" x2="10" y2="25" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="22" x2="18" y2="25" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
