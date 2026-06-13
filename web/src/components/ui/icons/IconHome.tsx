export function IconHome({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 10.5L12 3l9 7.5"
        stroke="#a59fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 9V20a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V9"
        stroke="#a59fff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
