export function IconPredict({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="10" cy="12" r="7" stroke="#8b55ff" strokeWidth="1.5" />
      <circle cx="10" cy="12" r="4" stroke="#8b55ff" strokeWidth="1" />
      <circle cx="10" cy="12" r="1.5" fill="#f87171" />
      <path
        d="M14.5 9L21 4"
        stroke="#facc15"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M21 4l-4.5 1.5L18 10z" fill="#facc15" />
    </svg>
  );
}
