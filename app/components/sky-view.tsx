"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { LuArrowUp, LuCompass, LuCrosshair, LuMoon, LuSparkles, LuSun } from "react-icons/lu";
import { CONSTELLATIONS } from "../lib/constellations";
import { formatLatitude, formatLongitude } from "../lib/iss-geo";
import {
  compassPoint,
  describeAltitude,
  locationErrorMessage,
  MIN_ALTITUDE,
  nextClockTime,
  parseCoordinates,
  skyAt,
  type SunPhase,
} from "../lib/sky";
import GlowCard from "./glow-card";
import SkyChart from "./sky-chart";
import StatCard from "./stat-card";

type Place = { latitude: number; longitude: number; source: "device" | "typed" };

// "Now" follows the clock. The others are the next time the clock shows that hour.
const TIMES = [
  { id: "now", label: "Now", hour: null },
  { id: "20", label: "8 PM", hour: 20 },
  { id: "22", label: "10 PM", hour: 22 },
  { id: "0", label: "12 AM", hour: 0 },
  { id: "4", label: "4 AM", hour: 4 },
] as const;
type TimeId = (typeof TIMES)[number]["id"];

const SUN_VALUE: Record<SunPhase, string> = { day: "Daytime", twilight: "Twilight", night: "Dark sky" };
const COLLAPSED_COUNT = 12;
const viewedFormat = new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });

// A clock that only starts once the page is in the browser, so the server and the first paint agree.
function useClock(periodMs: number): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, periodMs);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [periodMs]);
  return now;
}

export default function SkyView() {
  const [place, setPlace] = useState<Place | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeId, setTimeId] = useState<TimeId>("now");
  const [pinned, setPinned] = useState<Date | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [activeName, setActiveName] = useState<string | null>(null);
  const clock = useClock(60_000);

  const viewed = pinned ?? clock;
  const report = useMemo(
    () => (place && viewed ? skyAt(viewed, place.latitude, place.longitude) : null),
    [place, viewed],
  );

  function locate() {
    if (!("geolocation" in navigator)) {
      setError("This browser can\u2019t share its location. Enter coordinates below instead.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setPlace({ latitude: position.coords.latitude, longitude: position.coords.longitude, source: "device" });
      },
      (failure) => {
        setLocating(false);
        setError(locationErrorMessage(failure.code));
      },
      { timeout: 10_000, maximumAge: 10 * 60_000 },
    );
  }

  function submitTyped(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = parseCoordinates(String(data.get("latitude") ?? ""), String(data.get("longitude") ?? ""));
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setError(null);
    setPlace({ latitude: parsed.latitude, longitude: parsed.longitude, source: "typed" });
  }

  function chooseTime(option: (typeof TIMES)[number]) {
    setTimeId(option.id);
    setPinned(option.hour === null ? null : nextClockTime(option.hour, new Date()));
  }

  function changeLocation() {
    setPlace(null);
    setError(null);
    setActiveName(null);
  }

  if (!place) {
    return (
      <div className="space-y-8">
        {error && (
          <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4">
            <p className="font-semibold text-rose-200">Couldn&rsquo;t get a location</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        <div className="hud-corners panel space-y-6 p-6 sm:p-8">
          <div className="max-w-xl space-y-2">
            <h2 className="font-display text-lg font-bold tracking-wide text-white">Find the sky above you</h2>
            <p className="leading-relaxed text-violet-100/80">
              Share your location and this page works out which constellations are above the horizon, and where to look
              for them. Your location stays in this browser. It is never sent to a server.
            </p>
          </div>

          <button type="button" onClick={locate} disabled={locating} className="btn-cosmic inline-flex items-center gap-2 disabled:opacity-60">
            <LuCrosshair aria-hidden="true" />
            {locating ? "Finding you\u2026" : "Use my location"}
          </button>

          <form onSubmit={submitTyped} className="space-y-3 border-t border-violet-400/20 pt-6">
            <p className="text-sm text-violet-100/80">Or type in coordinates, in decimal degrees.</p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Latitude
                <input name="latitude" inputMode="decimal" autoComplete="off" placeholder="14.7" className="field w-32" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Longitude
                <input name="longitude" inputMode="decimal" autoComplete="off" placeholder="120.5" className="field w-32" />
              </label>
              <button type="submit" className="btn-cosmic">
                Show the sky
              </button>
            </div>
            <p className="text-xs text-violet-300/60">South and west are negative. 33.9 S, 18.4 E is -33.9 and 18.4.</p>
          </form>
        </div>
      </div>
    );
  }

  const topEntry = report?.visible[0];
  const listed = report ? (showAll ? report.visible : report.visible.slice(0, COLLAPSED_COUNT)) : [];
  const SunIcon = report?.sun.phase === "day" ? LuSun : LuMoon;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-sm">
          Sky for{" "}
          <span className="font-semibold text-white">
            {formatLatitude(place.latitude)}, {formatLongitude(place.longitude)}
          </span>{" "}
          <span className="text-violet-300/70">({place.source === "device" ? "from your device" : "entered by you"})</span>
        </p>
        <button type="button" onClick={changeLocation} className="glow-link cursor-pointer text-sm">
          Change location
        </button>
      </div>

      <div className="space-y-2">
        <div role="group" aria-label="Time to show" className="flex flex-wrap gap-2">
          {TIMES.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={timeId === option.id}
              onClick={() => chooseTime(option)}
              className="cursor-pointer rounded-full border border-violet-400/25 px-4 py-1.5 text-sm font-medium text-violet-200 transition-colors hover:border-violet-300/60 hover:text-white aria-pressed:border-violet-300/60 aria-pressed:bg-violet-600/45 aria-pressed:text-white"
            >
              {option.label}
            </button>
          ))}
        </div>
        {viewed && (
          <p className="text-xs text-violet-300/60">
            Showing {timeId === "now" ? "the sky right now" : "the sky"} for {viewedFormat.format(viewed)} on this
            device&rsquo;s clock.
          </p>
        )}
      </div>

      {!report && <p role="status">Calculating the sky&hellip;</p>}

      {report && (
        <>
          {report.sun.phase !== "night" && (
            <p role="status" className="panel px-5 py-3 text-sm text-violet-100/80">
              {report.sun.phase === "day"
                ? "The Sun is up at this time, so these constellations are overhead but too bright a sky to see. Pick an evening time to see tonight\u2019s sky."
                : "It\u2019s twilight. Only the brightest stars are out yet, and the sky gets darker over the next hour or so."}
            </p>
          )}

          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Sun"
              value={SUN_VALUE[report.sun.phase]}
              note={
                report.sun.altitude >= 0
                  ? `${Math.round(report.sun.altitude)}\u00B0 above the horizon`
                  : `${Math.round(-report.sun.altitude)}\u00B0 below the horizon`
              }
              icon={<SunIcon />}
            />
            <StatCard
              label="Constellations up"
              value={String(report.visible.length)}
              note={`more than ${MIN_ALTITUDE}\u00B0 high, of ${CONSTELLATIONS.length}`}
              icon={<LuSparkles />}
            />
            <StatCard
              label="Highest"
              value={topEntry ? `${Math.round(topEntry.altitude)}\u00B0` : "\u2014"}
              note={topEntry?.name}
              icon={<LuArrowUp />}
            />
            <StatCard
              label="Never set here"
              value={String(report.circumpolar.length)}
              note={report.circumpolar.length > 0 ? report.circumpolar.map((c) => c.name).join(", ") : "None at this latitude"}
              icon={<LuCompass />}
            />
          </dl>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
            <div className="hud-corners panel p-4">
              <SkyChart entries={report.aboveHorizon} activeName={activeName} onActiveChange={setActiveName} />
              <p className="mt-3 text-center text-xs text-violet-300/60">
                Looking straight up. The centre is overhead, the outer ring is the horizon, north is at the top and east
                is on the left.
              </p>
            </div>

            <section aria-labelledby="sky-list-title" className="space-y-3">
              <h2 id="sky-list-title" className="eyebrow">
                Above the horizon
              </h2>
              {report.visible.length === 0 ? (
                <p>No constellation is more than {MIN_ALTITUDE}&deg; up at this time.</p>
              ) : (
                <ol className="space-y-2">
                  {listed.map((c) => (
                    <li key={c.name} onMouseEnter={() => setActiveName(c.name)} onMouseLeave={() => setActiveName(null)}>
                      <GlowCard className="flex items-center justify-between gap-4 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-display text-sm font-bold tracking-wide text-white">{c.name}</p>
                          <p className="mt-0.5 text-xs text-violet-200/70">
                            {describeAltitude(c.altitude)}
                            {c.alwaysUp ? ", never sets here" : ""}
                          </p>
                        </div>
                        <p className="shrink-0 text-right">
                          <span className="stat-value text-lg">{Math.round(c.altitude)}&deg;</span>
                          <span className="block text-xs text-violet-300/70">{compassPoint(c.azimuth)}</span>
                        </p>
                      </GlowCard>
                    </li>
                  ))}
                </ol>
              )}

              {report.visible.length > COLLAPSED_COUNT && (
                <button type="button" onClick={() => setShowAll((value) => !value)} className="glow-link cursor-pointer text-sm">
                  {showAll ? "Show fewer" : `Show all ${report.visible.length}`}
                </button>
              )}

              {report.partial.length > 0 && (
                <p className="text-sm leading-relaxed text-violet-100/70">
                  Partly in view, low on the horizon: {report.partial.map((c) => c.name).join(", ")}.
                </p>
              )}
            </section>
          </div>

          <p className="text-xs leading-relaxed text-violet-300/50">
            Positions are worked out on your device from the middle point of each constellation, so a very large one can
            be partly in view even when its middle is not. Altitude is degrees above the horizon, and the letters are the
            compass direction to face. Serpens is listed as two parts, head and tail.
          </p>
        </>
      )}
    </div>
  );
}
