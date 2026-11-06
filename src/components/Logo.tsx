/** The INDEGE mark ("meeting" variant), matching the marketing website. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#14532D" />
      <g fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="29,14 13,32 29,50" stroke="#FFFFFF" />
        <polyline points="35,14 51,32 35,50" stroke="#D97706" />
        <polygon points="32,25 39,32 32,39 25,32" fill="#FFFFFF" stroke="none" />
      </g>
    </svg>
  );
}

export function Logo({ size = 36, light = false }: { size?: number; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className={`font-display text-xl font-extrabold tracking-[0.08em] ${light ? "text-white" : "text-primary"}`}>
        INDEGE
      </span>
    </span>
  );
}
