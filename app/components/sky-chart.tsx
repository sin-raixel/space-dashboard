import { MIN_ALTITUDE, type SkyEntry } from "../lib/sky";

const SIZE = 400;
const CENTER = SIZE / 2;
const RADIUS = 166; // the horizon circle

// Looking straight up: the point overhead is the centre, the horizon is the outer ring.
// North is at the top and east on the left, the way a printed star chart is held over your head.
function place(altitude: number, azimuth: number) {
  const r = (RADIUS * (90 - altitude)) / 90;
  const angle = (azimuth * Math.PI) / 180;
  return { x: CENTER - r * Math.sin(angle), y: CENTER - r * Math.cos(angle) };
}

const DIRECTIONS = [
  { label: "N", azimuth: 0 },
  { label: "E", azimuth: 90 },
  { label: "S", azimuth: 180 },
  { label: "W", azimuth: 270 },
];

export default function SkyChart({
  entries,
  activeName,
  onActiveChange,
}: {
  entries: SkyEntry[];
  activeName: string | null;
  onActiveChange: (name: string | null) => void;
}) {
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`Sky chart with ${entries.length} constellations above the horizon. The centre is straight overhead, north is at the top and east on the left. The list beside it gives the same information in words.`}
      className="mx-auto block h-auto w-full max-w-[34rem]"
    >
      <defs>
        <radialGradient id="sky-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1b0f45" />
          <stop offset="70%" stopColor="#0d0626" />
          <stop offset="100%" stopColor="#1f1050" />
        </radialGradient>
      </defs>

      <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#sky-glow)" stroke="#a78bfa" strokeOpacity={0.55} strokeWidth={1.5} />
      {[30, 60].map((altitude) => (
        <circle
          key={altitude}
          cx={CENTER}
          cy={CENTER}
          r={(RADIUS * (90 - altitude)) / 90}
          fill="none"
          stroke="#a78bfa"
          strokeOpacity={0.2}
          strokeDasharray="3 5"
        />
      ))}
      <line x1={CENTER} y1={CENTER - RADIUS} x2={CENTER} y2={CENTER + RADIUS} stroke="#a78bfa" strokeOpacity={0.15} />
      <line x1={CENTER - RADIUS} y1={CENTER} x2={CENTER + RADIUS} y2={CENTER} stroke="#a78bfa" strokeOpacity={0.15} />

      {DIRECTIONS.map(({ label, azimuth }) => {
        const { x, y } = place(-11, azimuth);
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fontWeight={700}
            fill="#c4b5fd"
          >
            {label}
          </text>
        );
      })}

      <g>
        {entries.map((c) => {
          const { x, y } = place(c.altitude, c.azimuth);
          const active = c.name === activeName;
          const flipLabel = x > CENTER + 70;
          return (
            <g
              key={c.name}
              onMouseEnter={() => onActiveChange(c.name)}
              onMouseLeave={() => onActiveChange(null)}
              opacity={activeName && !active ? 0.45 : 1}
            >
              <title>{`${c.name}, ${Math.round(c.altitude)}\u00B0 up`}</title>
              <circle
                cx={x}
                cy={y}
                r={active ? 6 : 3.5}
                fill={active ? "#e879f9" : c.altitude >= MIN_ALTITUDE ? "#c4b5fd" : "#7c6bb0"}
                stroke={active ? "#fdf4ff" : "none"}
                strokeWidth={1.5}
              />
              <text
                x={flipLabel ? x - 8 : x + 8}
                y={y}
                textAnchor={flipLabel ? "end" : "start"}
                dominantBaseline="central"
                fontSize={active ? 13 : 10.5}
                fontWeight={active ? 700 : 400}
                fill={active ? "#ffffff" : "#ddd6fe"}
                stroke="#05010f"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {c.abbr}
              </text>
            </g>
          );
        })}
      </g>

      <circle cx={CENTER} cy={CENTER} r={2} fill="#ddd6fe" fillOpacity={0.6} />
    </svg>
  );
}
