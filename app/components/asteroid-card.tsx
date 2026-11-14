import { LuTriangleAlert } from "react-icons/lu";
import { diameterM } from "../lib/asteroid-filters";
import { safeNasaUrl, type Asteroid } from "../lib/nasa";
import GlowCard from "./glow-card";

const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const day = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

// The distance track runs from Earth (left) out to 100 Moon distances, on a log scale,
// so a flyby inside the Moon's orbit is still easy to tell apart from a distant one.
const LOG_MIN = Math.log10(0.05);
const LOG_MAX = Math.log10(100);
const trackPct = (lunar: number) =>
  Math.min(1, Math.max(0, (Math.log10(Math.max(lunar, 0.05)) - LOG_MIN) / (LOG_MAX - LOG_MIN))) * 100;
const MOON_PCT = trackPct(1);

// Orb width grows with the log of the asteroid's width: 1 m is small, 1 km fills the frame.
const orbPx = (metres: number) => Math.round(Math.min(64, Math.max(14, 14 + 14 * Math.log10(Math.max(metres, 1)))));

const smallLabel = "eyebrow !text-[0.6rem] !tracking-[0.18em]";

export default function AsteroidCard({ asteroid: a }: { asteroid: Asteroid }) {
  const link = safeNasaUrl(a.jplUrl);
  const size = orbPx(diameterM(a));
  const when = day.format(new Date(`${a.date}T00:00:00Z`));

  return (
    <GlowCard className={`flex h-full flex-col gap-5 p-5 ${a.hazardous ? "panel-hazard" : ""}`}>
      <div className="flex items-center gap-4">
        <div className="grid size-16 shrink-0 place-items-center">
          <span aria-hidden="true" className={`rock ${a.hazardous ? "rock-hazard" : ""}`} style={{ width: size, height: size }} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-sm font-bold tracking-wide text-white">
            {link ? (
              <a href={link} target="_blank" rel="noreferrer" className="transition-colors hover:text-violet-300">
                {a.name}
              </a>
            ) : (
              a.name
            )}
          </h3>
          <p className="mt-1 text-xs text-violet-300/70">{when}</p>
          {a.hazardous && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-500/15 px-2.5 py-0.5 text-[0.7rem] font-medium text-rose-300 shadow-[0_0_14px_-2px_rgb(251_113_133/0.7)]">
              <LuTriangleAlert aria-hidden="true" className="motion-safe:animate-pulse" />
              Potentially hazardous
            </span>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className={smallLabel}>Width</dt>
          <dd className="mt-1 font-semibold text-white">
            {whole.format(a.diameterMinKm * 1000)}&ndash;{whole.format(a.diameterMaxKm * 1000)} m
          </dd>
        </div>
        <div>
          <dt className={smallLabel}>Speed</dt>
          <dd className="mt-1 font-semibold text-white">{whole.format(a.velocityKmh)} km/h</dd>
        </div>
      </dl>

      <div className="mt-auto">
        <div className="flex items-baseline justify-between gap-2">
          <span className={smallLabel}>Miss distance</span>
          <span className="text-sm font-semibold text-white">
            {a.missDistanceLunar.toFixed(1)} LD
            <span className="ml-1.5 text-xs font-normal text-violet-300/50">{whole.format(a.missDistanceKm)} km</span>
          </span>
        </div>

        <div aria-hidden="true" className="relative mt-3 h-9">
          <div className="absolute inset-x-0 top-2 h-px bg-gradient-to-r from-violet-300/70 via-violet-400/30 to-violet-400/5" />
          <span className="absolute top-2 left-0 size-3 -translate-y-1/2 rounded-full bg-sky-300 shadow-[0_0_10px_2px_rgb(125_211_252/0.7)]" />
          <span className="absolute top-3.5 left-0 text-[0.6rem] tracking-wide text-violet-300/60 uppercase">Earth</span>
          <span
            className="absolute top-2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/80 bg-slate-300/30"
            style={{ left: `${MOON_PCT}%` }}
          />
          <span
            className="absolute top-3.5 -translate-x-1/2 text-[0.6rem] tracking-wide text-violet-300/60 uppercase"
            style={{ left: `${MOON_PCT}%` }}
          >
            Moon
          </span>
          <span
            className={`absolute top-2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              a.hazardous
                ? "bg-rose-400 shadow-[0_0_12px_3px_rgb(251_113_133/0.8)]"
                : "bg-fuchsia-400 shadow-[0_0_12px_3px_rgb(232_121_249/0.8)]"
            }`}
            style={{ left: `${trackPct(a.missDistanceLunar)}%` }}
          />
        </div>
      </div>
    </GlowCard>
  );
}
