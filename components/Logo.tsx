/* HireTrack's logo: a violet tile with a job moving through three stages, rising to a coral "offer" */
export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="3" y="3" width="26" height="26" rx="8" fill="#5a3dd4" />
      <path d="M9 21.5 14 17l3.5 2.5L23 11" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="21.5" r="2" fill="#fff" />
      <circle cx="14" cy="17" r="2" fill="#fff" />
      <circle cx="23" cy="11" r="3.2" fill="#ff8f73" stroke="#5a3dd4" strokeWidth="1.2" />
    </svg>
  );
}
