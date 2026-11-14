// The Starboard mark: a four-point star with a dim left half (port) and a lit right half (starboard).
// It matches app/icon.svg, without the tile behind it.
const STAR = "M256 62 Q278 234 450 256 Q278 278 256 450 Q234 278 62 256 Q234 234 256 62 Z";

export default function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="62 62 388 388" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="mark-port" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id="mark-starboard" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#f5d0fe" />
          <stop offset="1" stopColor="#d946ef" />
        </linearGradient>
        <clipPath id="mark-left">
          <rect x="0" y="0" width="256" height="512" />
        </clipPath>
        <clipPath id="mark-right">
          <rect x="256" y="0" width="256" height="512" />
        </clipPath>
      </defs>
      <path d={STAR} fill="url(#mark-port)" clipPath="url(#mark-left)" />
      <path d={STAR} fill="url(#mark-starboard)" clipPath="url(#mark-right)" />
    </svg>
  );
}
