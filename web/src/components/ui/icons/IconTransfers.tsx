export function IconTransfers({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 8h13" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M13 5l4 3-4 3"
        stroke="#4ade80"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20 16H7" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M11 13l-4 3 4 3"
        stroke="#f87171"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
