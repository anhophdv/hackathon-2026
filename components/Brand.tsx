export function PizzaHutMark({ className = "h-7 w-7" }: { className?: string }) {
  // Stylized "roof" mark inspired by Pizza Hut UK branding
  return (
    <svg viewBox="0 0 64 64" className={className} aria-label="Pizza Hut">
      <defs>
        <linearGradient id="phRoof" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#FFCE00" />
          <stop offset="100%" stopColor="#FFB800" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="64" height="64" rx="14" fill="#EE3124" />
      <path d="M10 30 L32 14 L54 30 Z" fill="url(#phRoof)" />
      <rect x="14" y="30" width="36" height="20" rx="2" fill="#0F0F10" />
      <rect x="20" y="36" width="6" height="14" fill="#FFCE00" />
      <rect x="28" y="36" width="8" height="8" fill="#FFCE00" />
      <rect x="38" y="36" width="6" height="14" fill="#FFCE00" />
    </svg>
  );
}
