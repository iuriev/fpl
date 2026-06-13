export function IconReview({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M6 2h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"
        stroke="#0ea5e9"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14 2v4h4" stroke="#0ea5e9" strokeWidth="1.5" strokeLinejoin="round" />
      <path
        d="M8 13l2.5 2.5 5-5"
        stroke="#4ade80"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
