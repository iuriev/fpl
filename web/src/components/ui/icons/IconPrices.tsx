export function IconPrices({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M14 3v7" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M10 7l4-4 4 4"
        stroke="#4ade80"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="14" cy="18" rx="9" ry="3" fill="#4ade80" opacity="0.35" />
      <ellipse cx="14" cy="21" rx="9" ry="3" fill="#4ade80" opacity="0.6" />
      <ellipse cx="14" cy="24" rx="9" ry="3" fill="#4ade80" />
    </svg>
  );
}
