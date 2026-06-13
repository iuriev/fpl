export function IconPlayersWL({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M10 3H9L4 7l3 2v12h14V9l3-2-5-4h-1a4 4 0 01-8 0z"
        fill="#8b55ff"
      />
      <circle cx="22" cy="22" r="5" fill="#4ade80" />
      <path
        d="M19.5 22l2 2 3.5-3.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
