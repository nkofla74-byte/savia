export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Savia">
      <path d="M60 20 C 50 35, 40 50, 40 65 C 40 85, 48 100, 60 100 C 72 100, 80 85, 80 65 C 80 50, 70 35, 60 20 Z" fill="currentColor" />
      <path d="M 58 35 Q 62 45, 58 60" stroke="rgb(var(--color-bg-rgb))" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="60" cy="50" r="3" fill="rgb(var(--color-bg-rgb))" opacity="0.7" />
    </svg>
  );
}
