export function IconFixtures({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="3" y="5" width="22" height="20" rx="2" stroke="#0ea5e9" strokeWidth="1.5" />
      <line x1="3" y1="11" x2="25" y2="11" stroke="#0ea5e9" strokeWidth="1.5" />
      <line x1="9" y1="3" x2="9" y2="7" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="3" x2="19" y2="7" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="5" y="14" width="4" height="4" rx="0.5" fill="#0ea5e9" />
      <rect x="12" y="14" width="4" height="4" rx="0.5" stroke="#0ea5e9" strokeWidth="1" />
      <rect x="19" y="14" width="4" height="4" rx="0.5" stroke="#0ea5e9" strokeWidth="1" />
      <rect x="5" y="19" width="4" height="4" rx="0.5" stroke="#0ea5e9" strokeWidth="1" />
      <rect x="12" y="19" width="4" height="4" rx="0.5" stroke="#0ea5e9" strokeWidth="1" />
    </svg>
  );
}
