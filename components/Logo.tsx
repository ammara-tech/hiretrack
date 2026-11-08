/* HireTrack's logo: a green card with a tick moving along a track, and a coral dot for "up next" */
export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="3" y="3" width="26" height="26" rx="8" fill="#1b6b4f" />
      <rect x="7.5" y="20.5" width="17" height="2.4" rx="1.2" fill="#fff" opacity=".45" />
      <path d="m10 13.2 3.2 3.2 6.6-6.8" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="22.5" cy="21.7" r="2.6" fill="#f08a63" />
    </svg>
  );
}
