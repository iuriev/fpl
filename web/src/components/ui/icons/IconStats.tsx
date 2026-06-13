export function IconStats({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="4" y="16" width="6" height="8" rx="1" fill="#6c63ff" opacity="0.7" />
      <rect x="11" y="10" width="6" height="14" rx="1" fill="#6c63ff" opacity="0.85" />
      <rect x="18" y="6" width="6" height="18" rx="1" fill="#6c63ff" />
    </svg>
  );
}
