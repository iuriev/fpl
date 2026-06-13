export function IconTopPlayers({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="2" y="17" width="8" height="9" rx="1" fill="#6c63ff" />
      <rect x="10" y="12" width="8" height="14" rx="1" fill="#8b55ff" />
      <rect x="18" y="20" width="8" height="6" rx="1" fill="#0ea5e9" />
      <path
        d="M14 2l1.2 3.6H19l-3 2.2 1.2 3.6L14 9.2l-3.2 2.2L12 7.8l-3-2.2h3.8z"
        fill="#facc15"
      />
    </svg>
  );
}
