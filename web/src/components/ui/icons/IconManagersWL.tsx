export function IconManagersWL({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="12" cy="10" r="4" stroke="#a78bfa" strokeWidth="1.5" />
      <path
        d="M4 26c0-4.4 3.6-8 8-8s8 3.6 8 8"
        stroke="#a78bfa"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M23 3l1.2 3.6H28l-3 2.2 1.2 3.6L23 10.2l-3.2 2.2 1.2-3.6L18 6.6h3.8z"
        fill="#facc15"
      />
    </svg>
  );
}
